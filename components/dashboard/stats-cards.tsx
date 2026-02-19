import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Flame, Trophy, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  stats: {
    signsLearned: number;
    totalSigns: number;
    currentStreak: number;
    quizzesCompleted: number;
    overallProgress: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Signs Learned",
      value: `${stats.signsLearned}`,
      subtitle: `of ${stats.totalSigns} total signs`,
      icon: BookOpen,
    },
    {
      title: "Current Streak",
      value: `${stats.currentStreak}`,
      subtitle: stats.currentStreak === 1 ? "day" : "days",
      icon: Flame,
    },
    {
      title: "Quizzes Completed",
      value: `${stats.quizzesCompleted}`,
      subtitle: "quizzes taken",
      icon: Trophy,
    },
    {
      title: "Overall Progress",
      value: `${stats.overallProgress}%`,
      subtitle: "completion rate",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
