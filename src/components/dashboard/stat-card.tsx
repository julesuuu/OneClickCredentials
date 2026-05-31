import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorVariant?: "blue" | "yellow" | "green" | "red";
  subtitle?: string;
  href?: string;
}

const gradientMap = {
  blue: {
    bg: "bg-gradient-to-br from-blue-50 to-blue-100",
    icon: "text-blue-600 dark:text-blue-400",
  },
  yellow: {
    bg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
    icon: "text-yellow-600 dark:text-yellow-400",
  },
  green: {
    bg: "bg-gradient-to-br from-green-50 to-green-100",
    icon: "text-green-600 dark:text-green-400",
  },
  red: {
    bg: "bg-gradient-to-br from-red-50 to-red-100",
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
  const colors = gradientMap[colorVariant];

  const content = (
    <Card className={cn(
        "transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
        !href && "cursor-default"
      )}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn("rounded-xl p-3", colors.bg)}>
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
