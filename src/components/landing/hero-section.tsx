import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full bg-linear-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <Badge
          variant="secondary"
          className="mb-4 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20"
        >
          ✨ Fast & Secure Document Requests
        </Badge>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
          Request School Credentials Online
        </h1>
        <p className="text-xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
          No more lines at the registrar. Pay online or cash, track status, and schedule pickup. Your academic
          documents, delivered with ease.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Button asChild size="lg" variant="secondary" className="font-semibold">
            <Link href="/dashboard">
              Get Started
              <ArrowRight data-icon="inline-end" className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10 font-semibold"
          >
            <Link href="/auth/sign-in">Log In</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
