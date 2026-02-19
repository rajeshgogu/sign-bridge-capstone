import Link from "next/link";
import { Clock, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Difficulty, LessonStatus } from "@/types";

const difficultyVariantMap: Record<
  Difficulty,
  "default" | "secondary" | "destructive"
> = {
  beginner: "default",
  intermediate: "secondary",
  advanced: "destructive",
};

interface LessonCardProps {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  difficulty: string;
  estimatedMinutes: number | null;
  categorySlug: string;
  status?: string;
  completionPercentage?: number;
}

export function LessonCard({
  title,
  slug,
  description,
  difficulty,
  estimatedMinutes,
  categorySlug,
  status,
  completionPercentage,
}: LessonCardProps) {
  const isCompleted = status === "completed";

  return (
    <Link href={`/learn/${categorySlug}/${slug}`} className="group block">
      <Card
        className={cn(
          "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
          isCompleted && "border-green-500/30 bg-green-50/50 dark:bg-green-950/10"
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            {isCompleted && (
              <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {description && (
            <p className="text-muted-foreground text-sm line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={difficultyVariantMap[difficulty as Difficulty] ?? "default"}>
              {difficulty}
            </Badge>
            {estimatedMinutes != null && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {estimatedMinutes} min
              </span>
            )}
            {completionPercentage != null && !isCompleted && (
              <span className="text-xs text-muted-foreground ml-auto">
                {completionPercentage}% complete
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
