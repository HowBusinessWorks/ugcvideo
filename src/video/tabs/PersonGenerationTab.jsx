import { useState, useEffect, useRef } from 'react';
import { useAuth } from 'wasp/client/auth';
import { createPersonGeneration, getVideoById, getPendingGeneration, requestRefund, retryGeneration, getUserAssets } from 'wasp/client/operations';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '../../components/ui/select';
import { User, Download, Loader2, AlertCircle, RefreshCw, DollarSign } from 'lucide-react';
import { LoadingProgress } from '../../components/ui/loading-progress';
export default function PersonGenerationTab({ template, onTemplateUsed }) {
    const { data: user } = useAuth();
    // State
    const [mode, setMode] = useState('EASY');
    const [personFields, setPersonFields] = useState({
        gender: '',
        age: '',
        ethnicity: '',
        clothing: '',
        expression: '',
        background: '',
    });
    const [personPrompt, setPersonPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPerson, setGeneratedPerson] = useState(null);
    const [error, setError] = useState(null);
    const [currentGenerationId, setCurrentGenerationId] = useState(null);
    const [failedGeneration, setFailedGeneration] = useState(null);
    const [processingRefund, setProcessingRefund] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [generationStartTime, setGenerationStartTime] = useState(null);
    const pollingIntervalRef = useRef(null);
    const { toast } = useToast();
    // Check for existing pending generation on mount
    useEffect(() => {
        const checkPendingGeneration = async () => {
            if (!user?.id)
                return;
            try {
                // Query for user's most recent PENDING person generation
                const pendingGeneration = await getPendingGeneration({
                    assetType: 'PERSON',
                });
                if (pendingGeneration) {
                    console.log('Restored pending person generation:', pendingGeneration.id);
                    setCurrentGenerationId(pendingGeneration.id);
                    setIsGenerating(true);
                    // Set start time to when the generation was created
                    setGenerationStartTime(new Date(pendingGeneration.createdAt).getTime());
                }
            }
            catch (error) {
                console.error('Error checking for pending generation:', error);
            }
        };
        checkPendingGeneration();
    }, [user?.id]);
    // Poll for generation status
    useEffect(() => {
        if (!currentGenerationId || !isGenerating)
            return;
        const pollStatus = async () => {
            try {
                const data = await getVideoById({ id: currentGenerationId });
                if (data && data.status === 'COMPLETED' && data.generatedPersonUrl) {
                    setGeneratedPerson({ url: data.generatedPersonUrl, id: currentGenerationId });
                    setIsGenerating(false);
                    setCurrentGenerationId(null);
                    setFailedGeneration(null);
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                    }
                }
                else if (data && data.status === 'FAILED') {
                    setFailedGeneration(data);
                    setIsGenerating(false);
                    setCurrentGenerationId(null);
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                    }
                }
            }
            catch (err) {
                console.error('Error polling status:', err);
            }
        };
        // Start polling every 2 seconds
        pollingIntervalRef.current = setInterval(pollStatus, 2000);
        // Cleanup after 2 minutes
        const timeout = setTimeout(() => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            setError('Generation timed out. Please try again.');
            setIsGenerating(false);
            setCurrentGenerationId(null);
        }, 120000);
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            clearTimeout(timeout);
        };
    }, [currentGenerationId, isGenerating]);
    // Handle template from landing page
    useEffect(() => {
        if (template) {
            // Always switch to advanced mode for templates
            setMode('ADVANCED');
            if (template.prompt) {
                // Set the prompt
                setPersonPrompt(template.prompt);
                // Set person fields if available
                if (template.personSettings) {
                    setPersonFields(template.personSettings);
                }
                // Show toast notification
                toast({
                    title: 'Template Applied',
                    description: `"${template.title}" has been loaded. Customize and generate!`,
                });
            }
            else {
                // For "Create Custom" template with empty prompt
                toast({
                    title: 'Ready to Create',
                    description: 'Start building your custom generation in Advanced mode!',
                });
            }
            // Clear the template
            if (onTemplateUsed) {
                onTemplateUsed();
            }
        }
    }, [template, onTemplateUsed, toast]);
    const handleGenerate = async () => {
        setError(null);
        setIsGenerating(true);
        setGeneratedPerson(null);
        setFailedGeneration(null);
        setGenerationStartTime(Date.now());
        try {
            const result = await createPersonGeneration({
                mode,
                personFields: mode === 'EASY' ? personFields : undefined,
                personPrompt: mode === 'ADVANCED' ? personPrompt : undefined,
            });
            console.log('Generation started:', result.id);
            setCurrentGenerationId(result.id);
        }
        catch (err) {
            // Check if a failed generation was created in the database
            try {
                // Query for most recent person generation (might be FAILED)
                const result = await getUserAssets({
                    assetType: 'PERSON',
                    page: 1,
                    pageSize: 1,
                });
                const recentGen = result?.assets?.[0];
                if (recentGen && recentGen.status === 'FAILED' && recentGen.errorMessage) {
                    // Show detailed error in preview
                    setFailedGeneration(recentGen);
                    setIsGenerating(false);
                    return;
                }
            }
            catch (checkError) {
                console.error('Error checking for failed generation:', checkError);
            }
            // Fallback to generic error if no failed generation found
            setError(err.message || 'Failed to generate person');
            setIsGenerating(false);
        }
    };
    const validateForm = () => {
        if (mode === 'EASY') {
            const requiredFields = ['gender', 'age', 'ethnicity', 'clothing', 'expression', 'background'];
            for (const field of requiredFields) {
                if (!personFields[field]) {
                    return `Please select ${field}`;
                }
            }
        }
        else {
            if (!personPrompt.trim() || personPrompt.length < 10) {
                return 'Person prompt must be at least 10 characters';
            }
        }
        return null;
    };
    const handleDownload = async () => {
        if (!generatedPerson)
            return;
        try {
            // Fetch the image as a blob
            const response = await fetch(generatedPerson.url);
            const blob = await response.blob();
            // Create a blob URL
            const blobUrl = window.URL.createObjectURL(blob);
            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `person-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }
        catch (error) {
            console.error('Error downloading image:', error);
            setError('Failed to download image. Please try again.');
        }
    };
    const handleRefundRequest = async () => {
        if (!failedGeneration)
            return;
        setProcessingRefund(true);
        try {
            const result = await requestRefund({ generationId: failedGeneration.id });
            toast({
                title: 'Refund Successful',
                description: result.message,
            });
            setFailedGeneration({ ...failedGeneration, creditsRefunded: true });
        }
        catch (error) {
            toast({
                title: 'Refund Failed',
                description: error.message || 'Failed to process refund. Please try again.',
                variant: 'destructive',
            });
        }
        finally {
            setProcessingRefund(false);
        }
    };
    const handleRetry = async () => {
        if (!failedGeneration)
            return;
        setRetrying(true);
        try {
            const result = await retryGeneration({ generationId: failedGeneration.id });
            toast({
                title: 'Generation Retrying',
                description: 'Your generation has been restarted. Check back in a few minutes.',
            });
            // Start monitoring the retried generation
            setCurrentGenerationId(result.id);
            setIsGenerating(true);
            setFailedGeneration(null);
            setGenerationStartTime(Date.now());
        }
        catch (error) {
            toast({
                title: 'Retry Failed',
                description: error.message || 'Failed to retry generation. Please try again.',
                variant: 'destructive',
            });
        }
        finally {
            setRetrying(false);
        }
    };
    return (<div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Generate AI Person</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Create an AI-generated person image for your UGC video
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5"/>
              Person Settings
            </CardTitle>
            {user && (<div className="text-sm text-muted-foreground">
                Credits: <strong>{user.videoCredits || 0}</strong> (Cost: 1 credit)
              </div>)}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Selector */}
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(value) => setMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy Mode (Dropdowns)</SelectItem>
                  <SelectItem value="ADVANCED">Advanced Mode (Custom Prompt)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Easy Mode Fields */}
            {mode === 'EASY' && (<div className="space-y-3">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={personFields.gender} onValueChange={(value) => setPersonFields({ ...personFields, gender: value })}>
                    <SelectTrigger><SelectValue placeholder="Select gender"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Age Range</Label>
                  <Select value={personFields.age} onValueChange={(value) => setPersonFields({ ...personFields, age: value })}>
                    <SelectTrigger><SelectValue placeholder="Select age"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18-25">18-25</SelectItem>
                      <SelectItem value="26-35">26-35</SelectItem>
                      <SelectItem value="36-45">36-45</SelectItem>
                      <SelectItem value="46-55">46-55</SelectItem>
                      <SelectItem value="55+">55+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ethnicity</Label>
                  <Select value={personFields.ethnicity} onValueChange={(value) => setPersonFields({ ...personFields, ethnicity: value })}>
                    <SelectTrigger><SelectValue placeholder="Select ethnicity"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caucasian">Caucasian</SelectItem>
                      <SelectItem value="african">African</SelectItem>
                      <SelectItem value="asian">Asian</SelectItem>
                      <SelectItem value="hispanic">Hispanic</SelectItem>
                      <SelectItem value="middle-eastern">Middle Eastern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Clothing</Label>
                  <Select value={personFields.clothing} onValueChange={(value) => setPersonFields({ ...personFields, clothing: value })}>
                    <SelectTrigger><SelectValue placeholder="Select clothing"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="sporty">Sporty</SelectItem>
                      <SelectItem value="trendy">Trendy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Expression</Label>
                  <Select value={personFields.expression} onValueChange={(value) => setPersonFields({ ...personFields, expression: value })}>
                    <SelectTrigger><SelectValue placeholder="Select expression"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="happy">Happy & Smiling</SelectItem>
                      <SelectItem value="excited">Excited</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="confident">Confident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Background</Label>
                  <Select value={personFields.background} onValueChange={(value) => setPersonFields({ ...personFields, background: value })}>
                    <SelectTrigger><SelectValue placeholder="Select background"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White/Clean</SelectItem>
                      <SelectItem value="home">Home/Interior</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>)}

            {/* Advanced Mode */}
            {mode === 'ADVANCED' && (<div className="space-y-2">
                <Label>Custom Prompt</Label>
                <Textarea placeholder="Describe the person you want to generate..." value={personPrompt} onChange={(e) => setPersonPrompt(e.target.value)} rows={6} maxLength={500}/>
                <p className="text-xs text-muted-foreground">
                  {personPrompt.length}/500 characters (min 10)
                </p>
              </div>)}

            {/* Error */}
            {error && (<Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>)}

            {/* Generate Button */}
            <Button onClick={handleGenerate} disabled={isGenerating || !!validateForm()} className="w-full" size="lg">
              {isGenerating ? (<>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                  Generating...
                </>) : (<>
                  <User className="w-4 h-4 mr-2"/>
                  Generate Person
                </>)}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {isGenerating && generationStartTime && (<div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center p-8">
                <div className="w-full max-w-sm">
                  <LoadingProgress assetType="person" startTime={generationStartTime}/>
                </div>
              </div>)}

            {failedGeneration && !isGenerating && (<div className="space-y-4">
                <div className="aspect-[3/4] bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200">
                  <div className="text-center p-6 space-y-3">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto"/>
                    <p className="text-sm font-medium text-red-700">Generation Failed</p>
                  </div>
                </div>

                {/* Error Message */}
                {failedGeneration.errorMessage && (<Alert variant="destructive">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertDescription className="ml-2">
                      {failedGeneration.errorMessage}
                    </AlertDescription>
                  </Alert>)}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {failedGeneration.isRefundable && !failedGeneration.creditsRefunded && (<Button onClick={handleRefundRequest} variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50" disabled={processingRefund}>
                      {processingRefund ? (<>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin"/>
                          Processing...
                        </>) : (<>
                          <DollarSign className="w-3 h-3 mr-1"/>
                          Request Refund
                        </>)}
                    </Button>)}

                  {failedGeneration.creditsRefunded && (<Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-700 text-center">
                        ✓ Credits Refunded
                      </AlertDescription>
                    </Alert>)}

                  {failedGeneration.canRetry && (<Button onClick={handleRetry} variant="outline" className="w-full" disabled={retrying}>
                      {retrying ? (<>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin"/>
                          Retrying...
                        </>) : (<>
                          <RefreshCw className="w-3 h-3 mr-1"/>
                          Retry Generation
                        </>)}
                    </Button>)}
                </div>
              </div>)}

            {generatedPerson && !isGenerating && !failedGeneration && (<div className="space-y-4">
                <img src={generatedPerson.url} alt="Generated person" className="w-full rounded-lg"/>
                <Button onClick={handleDownload} className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2"/>
                  Download Person Image
                </Button>
              </div>)}

            {!isGenerating && !generatedPerson && !failedGeneration && (<div className="aspect-[3/4] bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <User className="w-8 h-8 mx-auto text-gray-300"/>
                  <p className="text-sm text-gray-500">Your generated person will appear here</p>
                </div>
              </div>)}
          </CardContent>
        </Card>
      </div>
    </div>);
}
