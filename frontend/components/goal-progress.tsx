import { Card } from '@/components/ui/card';

interface GoalProgressProps {
  name: string;
  current: number;
  target: number;
  progress: number;
}

export function GoalProgress({
  name,
  current,
  target,
  progress,
}: GoalProgressProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <span className="text-sm font-medium text-primary">{progress.toFixed(1)}%</span>
      </div>
      
      <div className="space-y-2">
        <div className="w-full bg-border rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>${current.toLocaleString()}</span>
          <span>${target.toLocaleString()}</span>
        </div>
      </div>
    </Card>
  );
}
