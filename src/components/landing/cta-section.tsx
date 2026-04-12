import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="w-full py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
          Join thousands of students who trust OneClick Credentials for their document needs.
        </p>
        <Button asChild size="lg" variant="secondary" className="font-semibold">
          <Link href="/dashboard">
            Create Free Account
            <ArrowRight data-icon="inline-end" className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
