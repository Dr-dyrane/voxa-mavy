
import { useUserStore } from "@/store/userStore";
import { Navigate } from "react-router-dom";
import { PhoneCall, MessageSquare, Clock, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoxaTextLogo } from "@/components/VoxaLogo";

const features = [
  {
    icon: MessageSquare,
    title: "Real-time Messaging",
    description: "Send and receive messages instantly with typing indicators and read receipts.",
  },
  {
    icon: PhoneCall,
    title: "Crystal-clear Calls",
    description: "Make high-quality voice and video calls with friends and colleagues.",
  },
  {
    icon: Clock,
    title: "Always Available",
    description: "Stay connected with persistent messaging history and offline support.",
  },
  {
    icon: Shield,
    title: "Security First",
    description: "End-to-end encryption and strong privacy controls keep your communications safe.",
  },
];

export default function Index() {
  const { isAuthenticated } = useUserStore();

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-6 flex flex-col items-center justify-center text-center">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        </div>
        
        <div className="mb-6">
          <VoxaTextLogo size="lg" withTagline />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4 max-w-3xl z-10">
          Modern Communication for the{" "}
          <span className="voxa-gradient-text">Digital Age</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 z-10">
          Connect with friends, family, and colleagues through seamless chat, voice, 
          and video calls. Experience communication reimagined.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 z-10">
          <Button asChild size="lg" className="bg-gradient-voxa hover:opacity-90">
            <a href="/auth">Get Started</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#features">Learn More</a>
          </Button>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-16 px-4 md:px-6 bg-secondary/40">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to <span className="voxa-gradient-text">Stay Connected</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="voxa-card animate-scale-in">
                <CardHeader className="pb-2">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4">
                    <feature.icon size={24} />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users already enjoying Voxa's seamless communication experience.
          </p>
          <Button asChild size="lg" className="bg-gradient-voxa hover:opacity-90">
            <a href="/auth">Create an Account</a>
          </Button>
        </div>
      </section>
    </div>
  );
}
