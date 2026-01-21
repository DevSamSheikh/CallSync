import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  iconClassName?: string;
}

export function KPICard({ title, value, icon: Icon, trend, className, iconClassName }: KPICardProps) {
  return (
    <Card className={cn("overflow-hidden border-none shadow-lg shadow-black/5 hover:shadow-xl transition-shadow duration-300", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-display font-bold tracking-tight">{value}</h3>
            {trend && <p className="text-xs text-emerald-500 font-medium mt-1">{trend}</p>}
          </div>
          <div className={cn("p-4 rounded-2xl bg-primary/10", iconClassName)}>
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
