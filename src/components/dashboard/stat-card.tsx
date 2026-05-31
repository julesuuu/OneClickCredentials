import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorVariant?: "blue" | "yellow" | "green" | "red";
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
}: StatCardProps) {
  const colors = colorMap[colorVariant];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn("rounded-full p-3", colors.bg)}>
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
