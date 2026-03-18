import Link from "next/link";
import { Scale, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Terms of Service
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Last updated: March 2026
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Agreement to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using OneClick Credentials, you accept and agree
              to be bound by the terms and provisions of this agreement. If you
              do not agree to these Terms of Service, you should not use our
              platform to request academic credentials and documents.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Description of Service
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  OneClick Credentials is an online platform that allows
                  students and alumni to request academic documents from
                  educational institutions. Our service includes:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>Online submission of document requests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>
                      Hybrid payment options (online via PayMongo or cash on
                      pickup)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>Real-time request status tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>Scheduled pickup at a designated time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>Email and SMS notifications for request updates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              User Eligibility
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  To use our service, you must:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Be currently enrolled to our institution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Be at least 18 years of age</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Provide accurate and complete information during
                      registration and request submission
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Maintain the security of your account credentials
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Document Request Terms
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Request Processing
                  </h3>
                  <p className="text-muted-foreground">
                    Document requests are processed within 5-7 business days
                    from the date of confirmation. Processing times may vary
                    depending on the type of document requested and the policies
                    of the issuing institution.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Payment
                  </h3>
                  <p className="text-muted-foreground">
                    All document fees must be paid at the time of request
                    submission. We accept payments via Xendit (credit/debit
                    cards, GCash, PayMaya) or cash on pickup. Additional fees
                    may apply for expedited processing.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Document Pickup
                  </h3>
                  <p className="text-muted-foreground">
                    Requested documents must be picked up within 30 days from
                    the notification date. Unclaimed documents may be returned
                    to the institution. A valid identification is required for
                    pickup.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Cancellations and Refunds
                  </h3>
                  <p className="text-muted-foreground">
                    Requests may be cancelled before processing begins. Refunds
                    are subject to the refund policy of the respective
                    educational institution. Contact support for cancellation
                    requests.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              User Obligations
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  When using our platform, you agree NOT to:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <span>Submit false or fraudulent information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <span>
                      Request documents for unauthorized third parties
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <span>
                      Use the service for any illegal or unauthorized purpose
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <span>
                      Attempt to gain unauthorized access to our systems
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <span>
                      Post or transmit harmful code, viruses, or malware
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <span>Harass, abuse, or harm other users</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Intellectual Property
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  The OneClick Credentials platform, including its design,
                  logos, content, and functionality, is protected by
                  intellectual property rights. You may not reproduce,
                  distribute, modify, or create derivative works from our
                  platform without express written permission.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Disclaimer of Warranties
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Our service is provided &quot;as is&quot; and &quot;as
                  available&quot; without warranties of any kind, either express
                  or implied, including but not limited to:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Warranties of merchantability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Fitness for a particular purpose</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Non-infringement</span>
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We do not guarantee that the service will be uninterrupted,
                  timely, secure, or error-free.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Limitation of Liability
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  OneClick Credentials shall not be liable for any indirect,
                  incidental, special, consequential, or punitive damages
                  resulting from your use of or inability to use the service.
                  This includes damages for errors, omissions, interruptions,
                  deletion of files, defects, delays in operation, or any
                  failure of performance.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Indemnification
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  You agree to indemnify, defend, and hold harmless OneClick
                  Credentials and its officers, directors, employees, and agents
                  from any claims, damages, losses, liabilities, costs, or
                  expenses arising out of your use of the service or violation
                  of these Terms of Service.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Termination
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  We reserve the right to terminate or suspend your account and
                  access to the service at our sole discretion, without notice,
                  for:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Violation of these Terms of Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Fraudulent or illegal activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Non-payment of applicable fees</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Governing Law
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  These Terms of Service shall be governed by and construed in
                  accordance with the laws of the Philippines. Any disputes
                  arising from these terms shall be resolved in the courts of
                  the Philippines.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Changes to Terms
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  We may update these Terms of Service from time to time. We
                  will notify you of any material changes by posting the new
                  terms on this page. Your continued use of the service after
                  such changes constitutes acceptance of the new terms.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Contact Information
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  If you have any questions about these Terms of Service, please
                  contact us:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Email: support@oneclickcredentials.com</li>
                  <li>Phone: +63 (XXX) XXX-XXXX</li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/privacy-policy">Privacy Policy</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/data-protection">Data Protection</Link>
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
