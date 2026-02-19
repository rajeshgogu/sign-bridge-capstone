"use client";

import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  activityDates: string[];
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  activityDates,
}: StreakDisplayProps) {
  const activitySet = new Set(activityDates);

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split("T")[0];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-5 text-orange-500" />
          Learning Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-6">
          <div>
            <div className="text-3xl font-bold">{currentStreak}</div>
            <p className="text-xs text-muted-foreground">Current streak</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-muted-foreground">
              {longestStreak}
            </div>
            <p className="text-xs text-muted-foreground">Longest streak</p>
          </div>
        </div>

        <div className="grid grid-cols-10 gap-1">
          <TooltipProvider delayDuration={0}>
            {last30Days.map((date) => {
              const isActive = activitySet.has(date);
              return (
                <Tooltip key={date}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "aspect-square rounded-sm transition-colors",
                        isActive
                          ? "bg-primary"
                          : "bg-muted"
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {isActive ? " - Active" : ""}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">Last 30 days</p>
      </CardContent>
    </Card>
  );
}
