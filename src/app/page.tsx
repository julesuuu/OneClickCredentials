"use client";

import { PublicHeader } from "@/components/public-header";
import {
  FeaturesSection,
  DocumentsSection,
  PricingSection,
  HowItWorksSection,
  FAQSection,
  CTASection,
  FooterSection,
} from "@/components/landing";
import { HeroSection } from "@/components/landing/hero-section";

export default function Landing() {
  return (
    <>
      <PublicHeader />
      <div className="min-h-screen w-full bg-background overflow-x-hidden">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* Available Documents Section */}
        <DocumentsSection />

        {/* Pricing Section */}
        <PricingSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Section */}
        <CTASection />

        {/* Footer */}
        <FooterSection />
      </div>
    </>
  );
}
