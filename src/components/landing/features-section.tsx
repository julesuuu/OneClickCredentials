import { Zap, CreditCard, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Easy Request",
    description:
      "Submit your document requests online in just a few clicks. No more waiting in lines.",
    badge: "Fast",
  },
  {
    icon: CreditCard,
    title: "Hybrid Payment",
    description:
      "Pay online via Xendit or choose cash on pickup. Flexible options for your convenience.",
    badge: "Flexible",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description:
      "Track your request status in real-time. Get notified when your documents are ready.",
    badge: "Live",
  },
  {
    icon: MapPin,
    title: "Schedule Pickup",
    description:
      "Choose a convenient time and location to pick up your documents.",
    badge: "Convenient",
  },
];

export function FeaturesSection() {
  return (
    <section className="w-full py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose OneClick Credentials?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We make requesting your academic documents simple, fast, and
            hassle-free with modern features designed for students.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-2 hover:border-primary/50 transition-all shadow-lg hover:shadow-xl"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  {feature.badge && (
                    <Badge variant="secondary">{feature.badge}</Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
