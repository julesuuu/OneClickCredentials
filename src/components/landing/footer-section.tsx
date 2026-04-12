import { FileText, Mail, Phone, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export function FooterSection() {
  return (
    <footer className="w-full border-t py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-lg">OneClick Credentials</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Making credential requests fast, secure, and hassle-free for students worldwide.
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
                <Button variant="link" className="h-auto p-0 text-primary" asChild>
                  <Link href="/auth/sign-in">Login</Link>
                </Button>
              </li>
              <li>
                <Button variant="link" className="h-auto p-0 text-primary" asChild>
                  <Link href="/auth/sign-up">Sign Up</Link>
                </Button>
              </li>
              <li>
                <Button variant="link" className="h-auto p-0 text-primary" asChild>
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
                <a href="mailto:support@oneclick.edu" className="hover:text-primary">
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
                <Button variant="link" className="h-auto p-0 text-primary" asChild>
                  <Link href="./privacy-policy">Privacy Policy</Link>
                </Button>
              </li>
              <li>
                <Button variant="link" className="h-auto p-0 text-primary" asChild>
                  <Link href="./terms-of-service">Terms of Service</Link>
                </Button>
              </li>
              <li>
                <Button variant="link" className="h-auto p-0 text-primary" asChild>
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
  );
}
