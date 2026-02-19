import Link from "next/link";
import { Clock, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuizCardProps {
  id: number;
  title: string;
  description: string | null;
  difficulty: string;
  questionCount: number | null;
  timeLimitSeconds: number | null;
  bestScore: number | null;
}

const difficultyVariant: Record<string, "default" | "secondary" | "destructive"> = {
  beginner: "default",
  intermediate: "secondary",
  advanced: "destructive",
};

export function QuizCard({
  id,
  title,
  description,
  difficulty,
  questionCount,
  timeLimitSeconds,
  bestScore,
}: QuizCardProps) {
  return (
    <Link href={`/practice/quiz/${id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant={difficultyVariant[difficulty] ?? "default"}>
              {difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {description && (
            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{questionCount ?? 10} questions</span>
            {timeLimitSeconds && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {Math.floor(timeLimitSeconds / 60)} min
              </span>
            )}
            {bestScore !== null && (
              <span className="flex items-center gap-1 text-primary">
                <Trophy className="size-3" />
                Best: {bestScore}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
