import { Link } from "wasp/client/router";
import { routes } from "wasp/client/router";
import { Button } from '../../components/ui/button';

const CTASection = () => {
  return (
    <div className="py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
          Ready to Create Your First 
          <span className="text-primary"> UGC Video</span>?
        </h2>
        
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of brands already using AI to create authentic, engaging video content. 
          Start generating professional UGC videos in minutes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to={routes.VideoGeneratorRoute.to}>
            <Button size="lg" className="text-lg px-8 py-4">
              Start Creating Videos
            </Button>
          </Link>
          
          <Link to={routes.PricingPageRoute.to}>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              View Pricing
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-8 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">8s</div>
            <div className="text-sm text-muted-foreground">Perfect Length</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">3-5min</div>
            <div className="text-sm text-muted-foreground">Generation Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">HD</div>
            <div className="text-sm text-muted-foreground">Quality Output</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTASection;