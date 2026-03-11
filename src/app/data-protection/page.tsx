"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Menu, X, Shield, Lock, Eye, Database, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function DataProtection() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background px-4 py-4 space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-bold text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/auth/sign-in">Log In</Link>
            </Button>
            <Button className="w-full justify-start" asChild>
              <Link href="/auth/sign-up">Sign Up Free</Link>
            </Button>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Data Protection Policy</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Last updated: March 2026
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              OneClick Credentials is committed to protecting your personal information and your right to privacy. 
              This Data Protection Policy explains how we collect, use, disclose, and safeguard your data when you 
              use our platform to request academic credentials and documents.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              Information We Collect
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Full name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Student ID number</li>
                    <li>Date of birth</li>
                    <li>Current address</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Academic Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Enrollment history</li>
                    <li>Program/course information</li>
                    <li>Academic records and grades</li>
                    <li>Requested document types</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Payment Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Payment method details (processed securely via PayMongo)</li>
                    <li>Transaction history</li>
                    <li>Billing address (for payment verification)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Technical Data</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>IP address</li>
                    <li>Browser type and version</li>
                    <li>Device information</li>
                    <li>Cookies and usage data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              How We Use Your Information
            </h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>To process and fulfill your document requests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>To communicate with you about your request status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>To send email and SMS notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>To process payments securely</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>To verify your identity as a student</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>To improve our services and user experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>To comply with legal obligations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Data Sharing & Disclosure</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  We may share your information with the following parties:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">School Registrar</h4>
                    <p className="text-sm text-muted-foreground">
                      Your academic information is shared with the school registrar to process and verify document requests.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Payment Processors</h4>
                    <p className="text-sm text-muted-foreground">
                      Payment data is processed securely by PayMongo. We do not store your complete payment details.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Service Providers</h4>
                    <p className="text-sm text-muted-foreground">
                      Third-party vendors who help us operate our platform (hosting, email delivery, SMS services).
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Legal Requirements</h4>
                    <p className="text-sm text-muted-foreground">
                      When required by law or to protect our rights, safety, or property.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Data Security</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  We implement appropriate technical and organizational security measures to protect your personal information:
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Encryption of data in transit (SSL/TLS)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Secure database storage with access controls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Regular security assessments and updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Limited access to personal data on a need-to-know basis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Secure payment processing via PayMongo (PCI-DSS compliant)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Under applicable data protection laws, you have the following rights:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Right to Access</h4>
                    <p className="text-sm text-muted-foreground">
                      You can request a copy of the personal data we hold about you.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Right to Correction</h4>
                    <p className="text-sm text-muted-foreground">
                      You can request correction of inaccurate personal data.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Right to Deletion</h4>
                    <p className="text-sm text-muted-foreground">
                      You can request deletion of your personal data (subject to legal requirements).
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Right to Data Portability</h4>
                    <p className="text-sm text-muted-foreground">
                      You can request your data in a structured, machine-readable format.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Data Retention</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  We retain your personal information only for as long as necessary to fulfill the purposes 
                  for which we collected it, including for the purposes of satisfying any legal, accounting, 
                  or reporting requirements. After this period, your data will be securely deleted.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Cookies</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to enhance your experience on our platform. 
                  You can control cookies through your browser settings. Disabling cookies may affect the 
                  functionality of our service.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Children&apos;s Privacy</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Our service is intended for students and alumni of educational institutions. We do not 
                  knowingly collect personal information from children under 13 years of age. If you believe 
                  we have collected information from a child under 13, please contact us immediately.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Changes to This Policy</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  We may update this Data Protection Policy from time to time. We will notify you of any 
                  changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. 
                  You are advised to review this policy periodically for any changes.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  If you have any questions or concerns about this Data Protection Policy or our data practices, 
                  please contact us:
                </p>
                <div className="space-y-3 text-muted-foreground">
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
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/privacy">Privacy Policy</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/terms">Terms of Service</Link>
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
