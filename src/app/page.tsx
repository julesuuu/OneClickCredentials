"use client";

import Link from "next/link";
import {
  FileText,
  CreditCard,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Star,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PublicHeader } from "@/components/public-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function Landing() {
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

  const documents = [
    { name: "Transcript of Records (TOR)" },
    { name: "Diploma" },
    { name: "Certificate of Good Moral Character" },
    { name: "Certificate of Enrollment" },
    { name: "Certificate of Grades" },
    { name: "Honorable Dismissal" },
  ];

  const pricing = [
    { name: "Transcript of Records (TOR)", price: 500 },
    { name: "Diploma", price: 300 },
    { name: "Good Moral Character", price: 100 },
    { name: "Certificate of Enrollment", price: 200 },
    { name: "Certificate of Grades", price: 150 },
    { name: "Honorable Dismissal", price: 250 },
  ];

  const faqs = [
    {
      question: "How long does it take to process my request?",
      answer:
        "Document processing takes 5-7 business days. Rush processing is available for an additional fee.",
    },
    {
      question: "Can I request multiple documents at once?",
      answer:
        "Yes! You can request as many documents as you need in a single transaction. Bulk discounts may apply.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "We accept online payments via Xendit (credit/debit cards, GCash, PayMaya) or cash on pickup.",
    },
    {
      question: "How will I know when my documents are ready?",
      answer:
        "You will receive email and SMS notifications, and you can track the status in your dashboard anytime.",
    },
    {
      question: "Can I cancel or modify my request?",
      answer:
        "Yes, you can cancel requests before they are processed. Contact support for modifications after submission.",
    },
  ];

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen w-full bg-background overflow-x-hidden">
        {/* Hero Section */}
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
              No more lines at the registrar. Pay online or cash, track status,
              and schedule pickup. Your academic documents, delivered with ease.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="font-semibold"
              >
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

        {/* Features Section */}
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
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Available Documents Section */}
        <section className="w-full py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                Documents
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Available Documents
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We offer a wide range of academic credentials to meet your needs
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {documents.map((doc, index) => (
                <Card
                  key={index}
                  className="bg-muted/50 shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-1">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                Pricing
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Transparent Pricing
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                No hidden fees. Simple and transparent pricing for all documents
              </p>
            </div>
            <Card className="w-full max-w-4xl mx-auto overflow-hidden shadow-xl border-2">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-primary-foreground font-bold w-full p-5">
                      Document Type
                    </TableHead>
                    <TableHead className="text-primary-foreground font-bold text-right p-5">
                      Price
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricing.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-medium p-5">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold p-5">
                        ₱{item.price}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <p className="text-muted-foreground text-sm">
                * Additional stamp: ₱30 each
              </p>
              <Separator orientation="vertical" className="h-4" />
              <p className="text-muted-foreground text-sm">
                * Bulk discounts available
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                Process
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get your documents in 4 simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                {
                  step: 1,
                  title: "Create Account",
                  desc: "Sign up in seconds",
                },
                {
                  step: 2,
                  title: "Request Documents",
                  desc: "Choose what you need",
                },
                { step: 3, title: "Make Payment", desc: "Pay online or cash" },
                { step: 4, title: "Pick Up", desc: "Schedule & collect" },
              ].map((item) => (
                <Card
                  key={item.step}
                  className="text-center relative shadow-lg"
                >
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                      {item.step}
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Got questions? We have answers.
              </p>
            </div>
            <Accordion type="single" collapsible className="max-w-3xl mx-auto">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of students who trust OneClick Credentials for
              their document needs.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="font-semibold"
            >
              <Link href="/dashboard">
                Create Free Account
                <ArrowRight data-icon="inline-end" className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-bold text-lg">
                    OneClick Credentials
                  </span>
                </Link>
                <p className="text-sm text-muted-foreground mb-4">
                  Making credential requests fast, secure, and hassle-free for
                  students worldwide.
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" /> Secure
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Zap className="h-3 w-3" /> Fast
                  </Badge>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-primary"
                      asChild
                    >
                      <Link href="/auth/sign-in">Login</Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-primary"
                      asChild
                    >
                      <Link href="/auth/sign-up">Sign Up</Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-primary"
                      asChild
                    >
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a
                      href="mailto:support@oneclick.edu"
                      className="hover:text-primary"
                    >
                      support@oneclick.edu
                    </a>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href="tel:+1234567890" className="hover:text-primary">
                      +1 (234) 567-890
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-primary"
                      asChild
                    >
                      <Link href="./privacy-policy">Privacy Policy</Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-primary"
                      asChild
                    >
                      <Link href="./terms-of-service">Terms of Service</Link>
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-primary"
                      asChild
                    >
                      <Link href="./data-protection">Data Protection</Link>
                    </Button>
                  </li>
                </ul>
              </div>
            </div>
            <Separator className="mb-8" />
            <div className="items-center gap-4 text-sm text-center text-muted-foreground">
              <p>&copy; 2026 OneClick Credentials. All rights reserved.</p>
              <div className="flex gap-4"></div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
