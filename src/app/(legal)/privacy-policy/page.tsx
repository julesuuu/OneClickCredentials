import Link from "next/link";
import {
  FileText,
  Menu,
  Shield,
  Eye,
  Hand,
  Globe,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <FileText className="h-8 w-8 text-primary" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-teal-500" />
            </div>
            <span className="text-xl font-bold text-foreground">
              OneClick Credentials
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" className="text-foreground" asChild>
              <Link href="/auth/sign-in">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Sign Up Free</Link>
            </Button>
          </nav>
          <details className="md:hidden">
            <summary className="list-none cursor-pointer p-2 text-foreground">
              <Menu className="h-6 w-6" />
            </summary>
            <div className="absolute top-16 left-0 right-0 border-t bg-background px-4 py-4 space-y-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-bold text-muted-foreground">
                  Theme
                </span>
                <ThemeToggle />
              </div>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/auth/sign-in">Log In</Link>
              </Button>
              <Button className="w-full justify-start" asChild>
                <Link href="/auth/sign-up">Sign Up Free</Link>
              </Button>
            </div>
          </details>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Privacy Policy
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Last updated: March 2026
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Overview
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This Privacy Policy is a legal notice that explains how OneClick
              Credentials handles your personal information. It satisfies
              transparency requirements under the{" "}
              <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>{" "}
              of the Philippines, as well as other applicable laws such as the
              GDPR (General Data Protection Regulation) and CCPA (California
              Consumer Privacy Act). This document answers your questions about:
              what data we collect, how we use it, who we share it with, and
              what rights you have over your data.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              OneClick Credentials is registered as a Personal Information
              Controller (PIC) under the National Privacy Commission (NPC). We
              are committed to protecting your fundamental right to privacy as
              guaranteed under the Philippine Constitution and RA 10173.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Hand className="h-6 w-6 text-primary" />
              Your Consent
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  By using OneClick Credentials, you acknowledge and agree to
                  the collection and use of your personal information as
                  described in this Privacy Policy. If you do not agree with
                  these terms, please do not use our platform.
                </p>
                <p className="text-muted-foreground">
                  We may update this policy from time to time. Continued use of
                  our service after changes constitutes acceptance of the
                  updated policy.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              What Information We Collect
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Information You Provide Directly
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>
                      Full name (for document requests and identification)
                    </li>
                    <li>
                      Email address (for account creation and notifications)
                    </li>
                    <li>
                      Phone number (for SMS notifications and verification)
                    </li>
                    <li>
                      Student ID number (for verification with institutions)
                    </li>
                    <li>Date of birth (for identity verification)</li>
                    <li>
                      Current address (for document delivery if applicable)
                    </li>
                    <li>
                      Academic information (enrollment status, program, year
                      level)
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Payment Information
                  </h3>
                  <p className="text-muted-foreground">
                    Payment data is processed directly through Xendit. We do not
                    store your credit card or banking details on our servers. We
                    only receive transaction confirmation and history from
                    Xendit.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Automatically Collected Information
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>IP address and approximate location</li>
                    <li>Browser type and version</li>
                    <li>Device type and operating system</li>
                    <li>Pages visited and time spent on platform</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              How We Use Your Information
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  We use your personal information for the following purposes:
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">1.</span>
                    <span>
                      <strong>Request Processing</strong> - To process and
                      fulfill your document requests with the school registrar
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">2.</span>
                    <span>
                      <strong>Identity Verification</strong> - To verify you are
                      a legitimate student or alumni of the institution
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">3.</span>
                    <span>
                      <strong>Notifications</strong> - To send you email and SMS
                      updates about your request status
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">4.</span>
                    <span>
                      <strong>Payment Processing</strong> - To process payments
                      through Xendit and maintain transaction records
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">5.</span>
                    <span>
                      <strong>Customer Support</strong> - To respond to your
                      inquiries and provide assistance
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">6.</span>
                    <span>
                      <strong>Service Improvement</strong> - To analyze usage
                      patterns and improve our platform
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">7.</span>
                    <span>
                      <strong>Legal Compliance</strong> - To comply with
                      applicable laws and regulations
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Data Sharing & Third Parties
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  We may share your personal information with the following
                  third parties:
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      School Registrar&apos;s Office
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Your academic information and document requests are shared
                      directly with the school registrar to process and fulfill
                      your requests. This is necessary for the core
                      functionality of our service.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Xendit (Payment Processor)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Payment transactions are processed through Xendit. They
                      collect and process your payment information directly. We
                      only receive confirmation of successful payments.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Email & SMS Service Providers
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      We use third-party services to deliver email and SMS
                      notifications about your request status.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Legal Authorities
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      We may disclose your information when required by law,
                      court order, or government regulation, or when necessary
                      to protect our rights, safety, or property.
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground mt-4">
                  <strong>We do not sell your personal information</strong> to
                  third parties for marketing purposes.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Hand className="h-6 w-6 text-primary" />
              Your Rights Under RA 10173, GDPR & CCPA
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Depending on your location and applicable law, you may have
                  the following rights. Under the
                  <strong> Data Privacy Act of 2012 (RA 10173)</strong>, as a
                  data subject in the Philippines, you have the following
                  rights:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to be Informed (Sec. 16a)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You have the right to know whether personal information
                      pertaining to you is being, has been, or will be
                      processed.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to Access (Sec. 16c)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You have the reasonable access to the contents of your
                      personal information and how it was processed.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to Rectification (Sec. 16d)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You have the right to dispute the inaccuracy or error in
                      your personal information and have it corrected.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to Erasure / Blocking (Sec. 16e)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You have the right to suspend, withdraw, or order the
                      blocking, removal, or destruction of your personal
                      information.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to Data Portability (Sec. 18)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You have the right to obtain a copy of your personal data
                      in an electronic or structured format.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to Damages (Sec. 16f)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You have the right to be indemnified for any damages
                      sustained due to unlawful use of your data.
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  <strong>Additional Rights Under GDPR & CCPA:</strong>
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to Withdraw Consent
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You can withdraw your consent for data processing at any
                      time.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to Opt-Out (CCPA)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      California residents can opt-out of the sale of their
                      personal information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Cookies & Tracking Technologies
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar tracking technologies to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Keep you logged in to your account</li>
                  <li>Remember your preferences and settings</li>
                  <li>Analyze how our platform is used</li>
                  <li>Improve our services based on user behavior</li>
                </ul>
                <p className="text-muted-foreground">
                  You can control cookies through your browser settings.
                  However, disabling cookies may affect the functionality of our
                  service.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Data Retention
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  We retain your personal information only for as long as
                  necessary to fulfill the purposes for which we collected it.
                  Specifically:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                  <li>
                    <strong>Active accounts:</strong> Data is retained as long
                    as your account is active
                  </li>
                  <li>
                    <strong>After account deletion:</strong> Data is retained
                    for up to 30 days before permanent deletion
                  </li>
                  <li>
                    <strong>Transaction records:</strong> Retained for 7 years
                    for legal and accounting purposes
                  </li>
                  <li>
                    <strong>Log files:</strong> Retained for 12 months for
                    security and analytics
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Children&apos;s Privacy
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Our service is intended for students and alumni of educational
                  institutions, typically aged 18 and above. We do not knowingly
                  collect personal information from children under 13 years of
                  age. If you are a parent or guardian and believe we have
                  collected information from a child under 13, please contact us
                  immediately so we can delete such information.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-primary" />
              Changes to This Policy
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time to reflect
                  changes in our practices or for operational, legal, or
                  regulatory reasons. When we make material changes, we will
                  post the updated policy on this page and update the &quot;Last
                  updated&quot; date. We encourage you to review this policy
                  periodically to stay informed about how we protect your
                  privacy.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Contact Us
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  If you have any questions, concerns, or requests regarding
                  this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-3 text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>support@oneclickcredentials.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>+63 (XXX) XXX-XXXX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>OneClick Credentials, [Address]</span>
                  </div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    Complaints with the National Privacy Commission
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    If you believe your rights under RA 10173 have been
                    violated, you may file a complaint with the National Privacy
                    Commission (NPC). Visit{" "}
                    <a
                      href="https://privacy.gov.ph"
                      target="_blank"
                      rel="noopener"
                      className="underline"
                    >
                      privacy.gov.ph
                    </a>{" "}
                    or contact the NPC at{" "}
                    <strong>complaints@privacy.gov.ph</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/data-protection">Data Protection Policy</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/terms-of-service">Terms of Service</Link>
            </Button>
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="w-full border-t py-8 bg-muted/30 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 OneClick Credentials. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
