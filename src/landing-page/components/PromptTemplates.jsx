import { Sparkles, ShoppingBag, Heart, Coffee, Smartphone, Shirt, Plus } from 'lucide-react';
const templates = [
    {
        id: 'create-custom',
        category: 'Custom',
        icon: <Plus className="w-5 h-5"/>,
        title: 'Create Custom',
        prompt: '',
        description: 'Start from scratch with your own custom prompt and settings'
    },
    {
        id: 'beauty-product',
        category: 'Beauty & Skincare',
        icon: <Sparkles className="w-5 h-5"/>,
        title: 'Beauty Product Review',
        prompt: 'Close-up shot as a woman holds up a skincare serum, examining the bottle with genuine interest. She opens it and applies a small amount to her cheek with her fingertips, gently patting it in. Camera stays close as she touches her face, feeling the texture. She looks at the camera with raised eyebrows and a slight nod, as if to say "not bad" with a natural smile.',
        description: 'Perfect for skincare and beauty product demos',
        personSettings: {
            gender: 'female',
            age: '26-35',
            ethnicity: 'caucasian',
            clothing: 'casual',
            expression: 'happy-smiling',
            background: 'home-interior'
        }
    },
    {
        id: 'fashion-unboxing',
        category: 'Fashion',
        icon: <ShoppingBag className="w-5 h-5"/>,
        title: 'Fashion Unboxing',
        prompt: 'A person sits with a package in front of them, opening it with casual curiosity. They pull out a piece of clothing and their eyes widen slightly. They stand up and hold it against their body, turning slightly to one side then the other. Camera pulls back to show full body as they do a quick little spin, then look at the camera with a satisfied smirk and a small shrug as if to say "yeah, this works".',
        description: 'Great for clothing and accessory reveals',
        personSettings: {
            gender: 'female',
            age: '18-25',
            ethnicity: 'diverse',
            clothing: 'trendy',
            expression: 'excited',
            background: 'bedroom'
        }
    },
    {
        id: 'tech-gadget',
        category: 'Technology',
        icon: <Smartphone className="w-5 h-5"/>,
        title: 'Tech Gadget Demo',
        prompt: 'A person picks up a tech gadget and turns it over in their hands, examining it with focused interest. They press the power button and watch the screen light up. Close-up of their face as they navigate through the interface, eyebrows raising in pleasant surprise. They tap a few features, then look up at the camera and give a quick approving nod with a half-smile, mouthing "nice" before looking back down at the device.',
        description: 'Ideal for electronics and tech products',
        personSettings: {
            gender: 'male',
            age: '26-35',
            ethnicity: 'asian',
            clothing: 'smart-casual',
            expression: 'focused-interested',
            background: 'modern-home'
        }
    },
    {
        id: 'food-review',
        category: 'Food & Beverage',
        icon: <Coffee className="w-5 h-5"/>,
        title: 'Food Product Taste Test',
        prompt: 'A person picks up a food or beverage item, glancing at the packaging briefly. They open it casually and take a bite or sip. Camera stays at eye level as they chew or taste, their expression thoughtful at first. Then their eyebrows raise slightly and they nod slowly with genuine surprise. They look at the product, then back at the camera with a "huh, actually pretty good" expression and do a small chef\'s kiss gesture.',
        description: 'Perfect for food and drink products',
        personSettings: {
            gender: 'female',
            age: '26-35',
            ethnicity: 'hispanic',
            clothing: 'casual',
            expression: 'delighted',
            background: 'kitchen'
        }
    },
    {
        id: 'lifestyle-product',
        category: 'Lifestyle',
        icon: <Heart className="w-5 h-5"/>,
        title: 'Lifestyle Product',
        prompt: 'Medium shot of a person in their living space using a lifestyle product in a natural, everyday way. They handle it casually while doing their routine - no forced enthusiasm. Camera captures them glancing at the product with quiet satisfaction, then continuing what they\'re doing. They look up briefly with a calm, content expression and give a small, genuine smile and relaxed thumbs up before going back to using it.',
        description: 'Great for home and lifestyle items',
        personSettings: {
            gender: 'male',
            age: '36-45',
            ethnicity: 'caucasian',
            clothing: 'comfortable-home',
            expression: 'relaxed-content',
            background: 'living-room'
        }
    },
    {
        id: 'apparel-tryOn',
        category: 'Fashion',
        icon: <Shirt className="w-5 h-5"/>,
        title: 'Apparel Try-On',
        prompt: 'Full body shot as a person walks into frame wearing a new clothing item. They do a slow 360-degree turn, running their hands down the fabric to show the fit. Camera stays at a slight angle as they pause and adjust the clothing, checking how it sits. They strike a casual pose, tilt their head with a confident smirk, and give the camera a playful wink or point before doing one more quick spin.',
        description: 'Showcase clothing and fashion items',
        personSettings: {
            gender: 'female',
            age: '18-25',
            ethnicity: 'black',
            clothing: 'fashionable',
            expression: 'confident',
            background: 'bedroom'
        }
    }
];
const PromptTemplates = ({ onTemplateClick }) => {
    return (<div className="py-12 sm:py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
            Start with a <span className="text-primary">Template</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Choose from our curated prompts to get started quickly. Click any template to auto-fill the generator.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {templates.map((template) => {
            const isCustom = template.id === 'create-custom';
            return (<button key={template.id} onClick={() => onTemplateClick(template)} className={`rounded-xl p-4 sm:p-6 hover:shadow-xl transition-all duration-300 border text-left group cursor-pointer ${isCustom
                    ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary'
                    : 'bg-card border-border/50 hover:border-primary/50'}`}>
              {/* Icon & Category */}
              <div className="flex items-center gap-3 mb-3">
                {template.icon && (<div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {template.icon}
                  </div>)}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {template.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-foreground mb-2 text-lg group-hover:text-primary transition-colors">
                {template.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {template.description}
              </p>

              {/* Prompt Preview */}
              {!isCustom && (<div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {template.prompt}
                  </p>
                </div>)}

              {/* CTA */}
              <div className="mt-4 text-sm font-medium text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                {isCustom ? 'Start creating' : 'Use this template'}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>);
        })}
        </div>
      </div>
    </div>);
};
export default PromptTemplates;
