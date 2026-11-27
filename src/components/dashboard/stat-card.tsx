import Link from "next/link";
import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorVariant?: "blue" | "yellow" | "green" | "red";
  subtitle?: ReactNode;
  href?: string;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: "text-blue-600 dark:text-blue-400",
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    icon: "text-yellow-600 dark:text-yellow-400",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/30",
    icon: "text-green-600 dark:text-green-400",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    icon: "text-red-600 dark:text-red-400",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  colorVariant = "blue",
  subtitle,
  href,
}: StatCardProps) {
  const colors = colorMap[colorVariant];

  const card = (
    <Card className={cn(href && "transition-colors hover:bg-muted/40")}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="mt-2 truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn("shrink-0 rounded-full p-3", colors.bg)}>
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  );
}
