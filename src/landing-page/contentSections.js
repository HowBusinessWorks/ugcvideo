import kivo from '../client/static/examples/kivo.webp';
import messync from '../client/static/examples/messync.webp';
import microinfluencerClub from '../client/static/examples/microinfluencers.webp';
import promptpanda from '../client/static/examples/promptpanda.webp';
import reviewradar from '../client/static/examples/reviewradar.webp';
import scribeist from '../client/static/examples/scribeist.webp';
import searchcraft from '../client/static/examples/searchcraft.webp';
export const features = [
    {
        name: 'AI-Powered Generation',
        description: 'Advanced AI creates realistic human reactions and authentic product showcases',
        emoji: '🤖',
        size: 'medium',
    },
    {
        name: 'Fast Processing',
        description: 'Get your UGC videos ready in minutes, not hours. No waiting around for results.',
        emoji: '⚡',
        size: 'large',
    },
    {
        name: 'Credit-Based System',
        description: 'Pay only for what you use. Flexible pricing that scales with your needs.',
        emoji: '💳',
        size: 'large',
    },
    {
        name: 'Brand Safe',
        description: 'Content appropriate for your brand with consistent quality standards',
        emoji: '🛡️',
        size: 'small',
    },
    {
        name: 'Any Product',
        description: 'Works with beauty, fashion, tech, toys, food - literally any product category',
        emoji: '📦',
        size: 'small',
    },
    {
        name: 'Natural Speech',
        description: 'Authentic dialogue and reactions that sound genuinely human and engaging',
        emoji: '🎙️',
        size: 'medium',
    },
    {
        name: 'Instant Download',
        description: 'Get your videos immediately after processing with high-quality output files',
        emoji: '📥',
        size: 'medium',
    },
];
export const testimonials = [
    {
        name: 'Sarah Chen',
        role: 'E-commerce Brand Manager',
        avatarSrc: 'https://images.unsplash.com/photo-1494790108755-2616b612b977?w=100&h=100&fit=crop&crop=face',
        socialUrl: 'https://linkedin.com/in/sarahchen',
        quote: "We went from spending $5000 on UGC creators to generating 50+ videos for $250. The ROI is insane and the quality looks completely authentic.",
    },
    {
        name: 'Marcus Rodriguez',
        role: 'Marketing Director @ TechFlow',
        avatarSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        socialUrl: 'https://twitter.com/marcusrtech',
        quote: 'These videos get 3x more engagement than our regular product ads. Customers actually think they\'re real UGC - which is exactly what we wanted.',
    },
    {
        name: 'Emma Thompson',
        role: 'Beauty Brand Founder',
        avatarSrc: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
        socialUrl: 'https://instagram.com/emmathompsonbeauty',
        quote: 'I was skeptical at first, but these AI videos are getting better conversion rates than our paid influencer content. Game changer for small brands.',
    },
    {
        name: 'David Park',
        role: 'Performance Marketing Lead',
        avatarSrc: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        socialUrl: 'https://linkedin.com/in/davidparkmarketing',
        quote: 'Scale is everything in performance marketing. Being able to generate 20 different UGC videos for A/B testing in one day is revolutionary.',
    },
    {
        name: 'Lisa Morgan',
        role: 'Social Media Manager',
        avatarSrc: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face',
        socialUrl: 'https://twitter.com/lisamorgansmm',
        quote: 'My clients are blown away by the authenticity. Nobody can tell these aren\'t real customer videos. The engagement speaks for itself.',
    },
    {
        name: 'Alex Kim',
        role: 'Dropshipping Entrepreneur',
        avatarSrc: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop&crop=face',
        socialUrl: 'https://instagram.com/alexkimdropship',
        quote: 'Finally found a solution that works for any product niche. From tech gadgets to beauty products - these videos convert like crazy.',
    },
];
export const faqs = [
    {
        id: 1,
        question: 'How realistic do the AI-generated videos look?',
        answer: 'Our AI creates highly authentic UGC videos with natural facial expressions, realistic speech patterns, and believable enthusiasm. The videos are designed to be indistinguishable from real customer testimonials, with no uncanny valley effects or obvious AI artifacts.',
    },
    {
        id: 2,
        question: 'What types of products work with your video generator?',
        answer: 'Our AI works with virtually any product category - beauty items, fashion accessories, tech gadgets, toys, food products, home goods, and more. The AI understands different product contexts and creates appropriate testimonials for each category.',
    },
    {
        id: 3,
        question: 'How long does it take to generate a video?',
        answer: 'Most videos are generated within 5-10 minutes. You\'ll receive real-time status updates during processing, and once complete, you can immediately download your high-quality 8-second UGC video in perfect 9:16 mobile format.',
    },
    {
        id: 4,
        question: 'Can I customize the script and appearance of the people in videos?',
        answer: 'Yes! You provide the reference image of the person you want featuring in the video and write your own custom script or promotional message. Our AI will create a natural, authentic testimonial based on your specifications.',
    },
    {
        id: 6,
        question: 'Are the videos safe to use for commercial purposes?',
        answer: 'Absolutely! All generated videos are brand-safe and suitable for commercial use in your marketing campaigns, social media ads, and product promotions. The content is designed to meet professional advertising standards.',
    },
    {
        id: 7,
        question: 'What video format and quality do I receive?',
        answer: 'You receive high-definition videos in 9:16 portrait format (perfect for TikTok, Instagram, and mobile viewing) at 8 seconds duration. The videos are optimized for maximum engagement and platform compatibility.',
    },
];
export const footerNavigation = {
    app: [],
    company: [
        { name: 'Privacy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
    ],
};
// UGC Video Examples for Input/Output Showcase
export const videoExamples = [
    {
        id: 1,
        title: 'Yoda Elfi',
        referenceImage: '/reference-images/Yoda Elfi.png',
        prompt: 'The ad should be with yoda recommending the toilet paper in a funny way. Yoda monologue is: "Elfi Toilet Paper. Luxury wipe, yes. Finest cushion for Jedi behinds. Power, comfort, prestige it gives. Use it once, never return you will.". The ad should be landscape and also it should be 7 seconds long.',
        videoSrc: '/ugc-videos/Yoda Elfi.mp4',
        description: 'Humorous Star Wars parody advertisement with iconic character endorsement and memorable script'
    },
    {
        id: 2,
        title: 'Labubu',
        referenceImage: '/reference-images/Labubu.jpeg',
        prompt: 'An old women promoting the brown labubu toy. The women says: "Just bought this Labubu for ten grand! Grandson\'s friend says it\'s rare and i can sell it on tiktok for more. DM me for offers"',
        videoSrc: '/ugc-videos/Labubu.mp4',
        description: 'Authentic UGC-style video featuring a grandmother promoting collectible toys with genuine enthusiasm'
    },
    {
        id: 3,
        title: 'Michael Kors',
        referenceImage: '/reference-images/Michael Kors.jpg',
        prompt: 'A young girl promoting the Michael Kors wallet to the camera',
        videoSrc: '/ugc-videos/Michael Kors.mp4',
        description: 'Natural product endorsement video featuring a young woman showcasing luxury accessories'
    },
    {
        id: 4,
        title: 'Tom Ford',
        referenceImage: '/reference-images/Tom Ford.webp',
        prompt: 'A young girl, between 21 and 29 yo, in her bathroom promoting Tom Ford parfume in front of the mirror. Casual look, natural, ugc. Promotion message: "This is maybe the best male parfume you can ever get! And... it also helps you not stink throughout the day. Highly recommend it!"',
        videoSrc: '/ugc-videos/Tom Ford.mp4',
        description: 'Casual bathroom mirror testimonial with authentic UGC aesthetics and relatable messaging'
    },
    {
        id: 5,
        title: 'Tinted Serum',
        referenceImage: '/reference-images/Tinted serum.jpg',
        prompt: 'a monkey talking about how good this skin care product is',
        videoSrc: '/ugc-videos/Tinted serum.mp4',
        description: 'Creative and playful skincare endorsement featuring unique character-based storytelling'
    }
];
// Legacy examples for backwards compatibility (can be removed later)
export const examples = [
    {
        name: 'Example #1',
        description: 'Describe your example here.',
        imageSrc: kivo,
        href: '#',
    },
    {
        name: 'Example #2',
        description: 'Describe your example here.',
        imageSrc: messync,
        href: '#',
    },
    {
        name: 'Example #3',
        description: 'Describe your example here.',
        imageSrc: microinfluencerClub,
        href: '#',
    },
    {
        name: 'Example #4',
        description: 'Describe your example here.',
        imageSrc: promptpanda,
        href: '#',
    },
    {
        name: 'Example #5',
        description: 'Describe your example here.',
        imageSrc: reviewradar,
        href: '#',
    },
    {
        name: 'Example #6',
        description: 'Describe your example here.',
        imageSrc: scribeist,
        href: '#',
    },
    {
        name: 'Example #7',
        description: 'Describe your example here.',
        imageSrc: searchcraft,
        href: '#',
    },
];
