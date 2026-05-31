import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface AccountStatusProps {
  isProfileComplete: boolean;
  isVerified: boolean;
}

export function AccountStatus({ isProfileComplete, isVerified }: AccountStatusProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-3">Account Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile</span>
            {isProfileComplete ? (
              <Badge variant="default" className="bg-green-50 text-green-700 hover:bg-green-50 border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <XCircle className="h-3 w-3" />
                Incomplete
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Verification</span>
            {isVerified ? (
              <Badge variant="default" className="bg-green-50 text-green-700 hover:bg-green-50 border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {isProfileComplete ? "Pending" : "Not Submitted"}
              </Badge>
            )}
          </div>
        </div>
        {(!isProfileComplete || !isVerified) && (
          <Link
            href="/dashboard/settings/profile"
            className="mt-3 block w-full text-center text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg px-4 py-2 transition-colors"
          >
            Complete Your Profile
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
