import Link from "next/link";
import {
  Shield,
  Lock,
  Eye,
  Database,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicHeader } from "@/components/public-header";

export default function DataProtection() {
  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <PublicHeader />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Data Protection Policy
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
              Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              OneClick Credentials is committed to protecting your personal
              information and your right to privacy. This Data Protection Policy
              explains the technical and organizational measures we implement to
              safeguard your data in compliance with the{" "}
              <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>{" "}
              of the Philippines, specifically{" "}
              <strong>Section 20 (Security of Personal Information)</strong> and{" "}
              <strong>Section 21 (Principle of Accountability)</strong>.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              As a Personal Information Controller (PIC) registered with the
              National Privacy Commission (NPC), we are committed to ensuring
              the confidentiality, integrity, and security of your personal
              information.
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
                  <h3 className="font-semibold text-foreground mb-2">
                    Personal Information
                  </h3>
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
                  <h3 className="font-semibold text-foreground mb-2">
                    Academic Information
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Enrollment history</li>
                    <li>Program/course information</li>
                    <li>Academic records and grades</li>
                    <li>Requested document types</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Payment Information
                  </h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>
                      Payment method details (processed securely via Xendit)
                    </li>
                    <li>Transaction history</li>
                    <li>Billing address (for payment verification)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Technical Data
                  </h3>
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
                    <span>
                      To communicate with you about your request status
                    </span>
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
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Data Sharing & Disclosure
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  We may share your information with the following parties:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      School Registrar
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Your academic information is shared with the school
                      registrar to process and verify document requests.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Payment Processors
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Payment data is processed securely by Xendit. We do not
                      store your complete payment details.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Service Providers
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Third-party vendors who help us operate our platform
                      (hosting, email delivery, SMS services).
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Legal Requirements
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      When required by law or to protect our rights, safety, or
                      property.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Data Security (RA 10173 Sec. 20)
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  In compliance with Section 20 of the Data Privacy Act of 2012,
                  we implement reasonable and appropriate organizational,
                  physical, and technical measures to protect personal
                  information against accidental or unlawful destruction,
                  alteration, disclosure, as well as against any other unlawful
                  processing.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      <strong>Encryption</strong> - SSL/TLS encryption for data
                      in transit; encrypted storage for sensitive data at rest
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      <strong>Access Controls</strong> - Role-based access
                      control (RBAC) with need-to-know principle
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      <strong>Secure Infrastructure</strong> - Firewalls,
                      intrusion detection/prevention systems (IDS/IPS)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      <strong>Vulnerability Management</strong> - Regular
                      security assessments, penetration testing, and patch
                      management
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      <strong>Employee Confidentiality</strong> - All employees
                      sign confidentiality agreements; mandatory data privacy
                      training
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      <strong>Secure Development</strong> - Secure coding
                      practices and code review processes
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      <strong>PCI-DSS Compliance</strong> - Secure payment
                      processing via Xendit (PCI-DSS Level 1 compliant)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      <strong>Backup & Disaster Recovery</strong> - Regular
                      automated backups with tested restore procedures
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Data Breach Notification (RA 10173 Sec. 20(f))
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  In compliance with Section 20(f) of the Data Privacy Act of
                  2012, we have established procedures for handling personal
                  data breaches:
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">1.</span>
                    <span>
                      <strong>Detection & Assessment</strong> - We monitor for
                      security incidents and assess potential breaches promptly
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">2.</span>
                    <span>
                      <strong>NPC Notification</strong> - We will notify the
                      National Privacy Commission within 72 hours of discovering
                      a breach
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">3.</span>
                    <span>
                      <strong>Data Subject Notification</strong> - Affected
                      individuals will be notified without undue delay when the
                      breach is likely to result in serious harm
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">4.</span>
                    <span>
                      <strong>Remediation</strong> - We will take immediate
                      action to mitigate the breach and prevent future incidents
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Accountability (RA 10173 Sec. 21)
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  In compliance with Section 21 of the Data Privacy Act of 2012:
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      We are accountable for personal information under our
                      control or custody, including information transferred to
                      third parties for processing
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      We use contractual means to ensure third-party processors
                      provide comparable protection
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      We have designated a Data Protection Officer (DPO)
                      responsible for compliance
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>
                      Our privacy practices are documented and subject to
                      regular review
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Your Rights
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Under applicable data protection laws, you have the following
                  rights:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to Access
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You can request a copy of the personal data we hold about
                      you.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to Correction
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You can request correction of inaccurate personal data.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to Deletion
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You can request deletion of your personal data (subject to
                      legal requirements).
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      Right to Data Portability
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You can request your data in a structured,
                      machine-readable format.
                    </p>
                  </div>
                </div>
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
                  necessary to fulfill the purposes for which we collected it,
                  including for the purposes of satisfying any legal,
                  accounting, or reporting requirements. After this period, your
                  data will be securely deleted.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Cookies</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to enhance
                  your experience on our platform. You can control cookies
                  through your browser settings. Disabling cookies may affect
                  the functionality of our service.
                </p>
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
                  institutions. We do not knowingly collect personal information
                  from children under 13 years of age. If you believe we have
                  collected information from a child under 13, please contact us
                  immediately.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Changes to This Policy
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  We may update this Data Protection Policy from time to time.
                  We will notify you of any changes by posting the new policy on
                  this page and updating the &quot;Last updated&quot; date. You
                  are advised to review this policy periodically for any
                  changes.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Contact Us & Data Protection Officer
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  If you have any questions or concerns about this Data
                  Protection Policy or our data practices, please contact our
                  Data Protection Officer (DPO):
                </p>
                <div className="space-y-3 text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>dpo@oneclickcredentials.com</span>
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
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    National Privacy Commission
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    For complaints regarding potential data privacy violations,
                    you may also contact the NPC:
                    <br />
                    <strong>Website:</strong>{" "}
                    <a
                      href="https://privacy.gov.ph"
                      target="_blank"
                      rel="noopener"
                      className="underline"
                    >
                      privacy.gov.ph
                    </a>
                    <br />
                    <strong>Email:</strong> complaints@privacy.gov.ph
                    <br />
                    <strong>Hotline:</strong> (02) 8-234-4567
                  </p>
                </div>
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
