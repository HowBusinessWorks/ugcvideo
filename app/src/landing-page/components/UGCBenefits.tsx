import { Sparkles, Users, Package, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';

const UGCBenefits = () => {
  const benefits = [
    {
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      title: "Professional Quality",
      description: "No weird AI artifacts or uncanny valley effects. Every video looks professionally crafted with natural lighting and authentic reactions.",
      features: ["Crystal clear 9:16 format", "Natural lighting", "Smooth transitions", "Professional aesthetics"]
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Authentic Human Feel", 
      description: "Genuine emotions, natural speech patterns, and believable enthusiasm that your audience will actually connect with and trust.",
      features: ["Real conversation flow", "Natural expressions", "Believable reactions", "Human-like gestures"]
    },
    {
      icon: <Package className="w-8 h-8 text-primary" />,
      title: "Works With Any Product",
      description: "From luxury perfumes to everyday items - our AI understands how to showcase any product authentically without breaking the experience.",
      features: ["Universal compatibility", "Product-safe AI", "Brand appropriate", "Context aware"]
    }
  ];

  return (
    <div className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Why Our UGC Videos Actually <span className="text-primary">Work</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Skip the weird AI vibes. Get authentic, professional videos that your customers 
            will trust and engage with.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                </div>
                
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {benefit.description}
                </p>
                
                <ul className="space-y-2">
                  {benefit.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
};

export default UGCBenefits;