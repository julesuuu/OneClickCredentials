import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BalanceCardProps {
  pendingAmount: number;
}

export function BalanceCard({ pendingAmount }: BalanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pending Balance</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {pendingAmount > 0 ? (
          <div className="space-y-2">
            <p className="text-2xl font-bold">₱{pendingAmount.toLocaleString()}</p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/payments">
                <CreditCard className="mr-2 h-4 w-4" />
                View Payments
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No pending payments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
