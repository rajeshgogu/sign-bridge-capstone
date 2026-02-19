import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Lightbulb } from "lucide-react";
import Link from "next/link";

interface RecommendationCardsProps {
  recommendations: {
    title: string;
    description: string;
    href: string;
    type: string;
  }[];
}

export function RecommendationCards({
  recommendations,
}: RecommendationCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended for You</CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lightbulb className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Complete some lessons to get personalized recommendations
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {recommendations.slice(0, 4).map((rec) => (
              <Link
                key={rec.href}
                href={rec.href}
                className="min-w-[200px] flex-shrink-0"
              >
                <div className="rounded-lg border p-4 hover:bg-accent transition-colors h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {rec.type}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-semibold leading-tight">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {rec.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
