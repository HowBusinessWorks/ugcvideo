import { Clock, Smartphone, Zap, Shield, Package, Mic } from 'lucide-react';
const VideoFeatures = () => {
    const features = [
        {
            icon: <Clock className="w-6 h-6"/>,
            title: "8-Second Videos",
            description: "Perfect length for social media engagement and attention spans"
        },
        {
            icon: <Smartphone className="w-6 h-6"/>,
            title: "Portrait Format",
            description: "Optimized 9:16 aspect ratio for TikTok, Instagram, and mobile viewing"
        },
        {
            icon: <Zap className="w-6 h-6"/>,
            title: "Fast Processing",
            description: "Get your UGC videos ready in minutes, not hours"
        },
        {
            icon: <Shield className="w-6 h-6"/>,
            title: "Brand Safe",
            description: "Content appropriate for your brand with consistent quality standards"
        },
        {
            icon: <Package className="w-6 h-6"/>,
            title: "Any Product",
            description: "Works with beauty, fashion, tech, toys, food - any product category"
        },
        {
            icon: <Mic className="w-6 h-6"/>,
            title: "Natural Speech",
            description: "Authentic dialogue and reactions that sound genuinely human"
        }
    ];
    return (<div className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Everything You Need for <span className="text-primary">UGC Videos</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional video generation made simple. No filming, no editing, no hassle.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (<div key={index} className="bg-card rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-border/50">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>))}
        </div>


      </div>
    </div>);
};
export default VideoFeatures;
