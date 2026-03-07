import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
}

export function DashboardCard({
  title,
  value,
  change,
  changeLabel,
  description,
  icon,
  trend,
}: DashboardCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">
            {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
          </p>
        </div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2">
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
          <span className={trend === 'up' ? 'text-success' : 'text-destructive'}>
            {trend === 'up' ? '+' : ''}{change}%
          </span>
          {changeLabel && (
            <span className="text-sm text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}

      {description && (
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      )}
    </Card>
  );
}
