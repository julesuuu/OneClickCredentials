import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import Link from "next/link";

interface BalanceCardProps {
  pendingAmount: number;
}

export function BalanceCard({ pendingAmount }: BalanceCardProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-slate-300">Pending Balance</CardTitle>
          <CreditCard className="h-5 w-5 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {pendingAmount > 0 ? (
          <div className="space-y-3">
            <p className="text-3xl font-bold text-white tabular-nums">₱{pendingAmount.toLocaleString()}</p>
            <Link
              href="/dashboard/payments"
              className="block w-full text-center text-sm font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-4 py-2.5 transition-colors"
            >
              View Payments &rarr;
            </Link>
          </div>
        ) : (
          <div className="text-center py-4">
            <CreditCard className="mx-auto h-8 w-8 text-slate-500 mb-2" />
            <p className="text-sm text-slate-400">No pending payments</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
