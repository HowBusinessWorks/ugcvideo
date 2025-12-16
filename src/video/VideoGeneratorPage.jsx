import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Image, Video, Library } from 'lucide-react';
import PersonGenerationTab from './tabs/PersonGenerationTab';
import CompositeGenerationTab from './tabs/CompositeGenerationTab';
import VideoGenerationTab from './tabs/VideoGenerationTab';
import LibraryTab from './tabs/LibraryTab';
export default function VideoGeneratorPage() {
    const location = useLocation();
    const locationState = location.state;
    const [activeTab, setActiveTab] = useState(locationState?.activeTab || 'person');
    const [template, setTemplate] = useState(locationState?.template);
    // Clear template after it's been used
    useEffect(() => {
        if (template) {
            // Clear the navigation state to prevent template from persisting
            window.history.replaceState({}, document.title);
        }
    }, [template]);
    const tabs = [
        { id: 'person', label: 'Person', icon: User },
        { id: 'composite', label: 'Composite', icon: Image },
        { id: 'video', label: 'Video', icon: Video },
        { id: 'library', label: 'Library', icon: Library },
    ];
    return (<div className="container mx-auto px-4 py-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">UGC Video Generator</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Create professional UGC-style videos in 3 independent stages
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b mb-4 sm:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`
                flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 font-medium transition-colors whitespace-nowrap flex-shrink-0
                ${isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}
              `}>
              <Icon className="w-4 h-4"/>
              <span className="text-sm sm:text-base">{tab.label}</span>
            </button>);
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'person' && (<PersonGenerationTab template={template} onTemplateUsed={() => setTemplate(undefined)}/>)}
        {activeTab === 'composite' && <CompositeGenerationTab />}
        {activeTab === 'video' && <VideoGenerationTab />}
        {activeTab === 'library' && <LibraryTab />}
      </div>
    </div>);
}
