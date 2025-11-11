import VideoShowcase from './components/VideoShowcase';
import VideoFeatures from './components/VideoFeatures';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Hero from './components/Hero';
import { videoExamples, faqs, footerNavigation } from './contentSections';

export default function LandingPage() {
  return (
    <div className='bg-background text-foreground'>
      <main className='isolate'>
        <Hero />
        <VideoShowcase examples={videoExamples} />
        <VideoFeatures />
        <FAQ faqs={faqs} />
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}

