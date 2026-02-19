import Link from "next/link";
import {
  BookOpen,
  Hand,
  MessageSquare,
  Hash,
  Shapes,
  Users,
  Calendar,
  MapPin,
  Utensils,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Hand,
  MessageSquare,
  Hash,
  Shapes,
  Users,
  Calendar,
  MapPin,
  Utensils,
  Heart,
};

interface CategoryCardProps {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  color: string | null;
  totalLessons: number | null;
  completedLessons: number;
  completionPercentage: number;
}

export function CategoryCard({
  name,
  slug,
  description,
  iconName,
  color,
  totalLessons,
  completedLessons,
  completionPercentage,
}: CategoryCardProps) {
  const Icon = (iconName && iconMap[iconName]) || BookOpen;
  const total = totalLessons ?? 0;

  return (
    <Link href={`/learn/${slug}`} className="group block">
      <Card
        className={cn(
          "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
          "cursor-pointer"
        )}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                color ? "" : "bg-primary/10 text-primary"
              )}
              style={
                color
                  ? { backgroundColor: `${color}20`, color }
                  : undefined
              }
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base group-hover:text-primary transition-colors">
                {name}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {description && (
            <p className="text-muted-foreground text-sm line-clamp-2">
              {description}
            </p>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedLessons} of {total} lessons
              </span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
