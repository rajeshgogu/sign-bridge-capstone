import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LessonProgressBarProps {
  completed: number;
  total: number;
  className?: string;
}

export function LessonProgressBar({
  completed,
  total,
  className,
}: LessonProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {completed} of {total} signs
        </span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <Progress value={percentage} />
    </div>
  );
}
