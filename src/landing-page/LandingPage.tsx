import { useNavigate } from 'react-router-dom';
import VideoShowcase from './components/VideoShowcase';
import VideoFeatures from './components/VideoFeatures';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Hero from './components/Hero';
import PromptTemplates, { PromptTemplate } from './components/PromptTemplates';
import { videoExamples, faqs, footerNavigation } from './contentSections';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleTemplateClick = (template: PromptTemplate) => {
    // Navigate to generator page with template data in state
    // Remove icon since React elements can't be serialized
    const { icon, ...serializableTemplate } = template;
    navigate('/generate', {
      state: {
        template: serializableTemplate,
        activeTab: 'person' // Start with person generation
      }
    });
  };

  return (
    <div className='bg-background text-foreground'>
      <main className='isolate'>
        <Hero />
        <PromptTemplates onTemplateClick={handleTemplateClick} />
        <VideoShowcase examples={videoExamples} />
        <VideoFeatures />
        <FAQ faqs={faqs} />
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}

