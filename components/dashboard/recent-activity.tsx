import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  CheckCircle2,
  Trophy,
  Camera,
  Hand,
  Activity,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/helpers/format";

interface RecentActivityProps {
  activities: {
    id: number;
    activityType: string;
    entityType: string | null;
    entityId: number | null;
    createdAt: Date;
  }[];
}

const activityConfig: Record<
  string,
  { icon: React.ElementType; label: string }
> = {
  lesson_started: { icon: BookOpen, label: "Started a lesson" },
  lesson_completed: { icon: CheckCircle2, label: "Completed a lesson" },
  quiz_completed: { icon: Trophy, label: "Completed a quiz" },
  practice_session: { icon: Camera, label: "Practice session" },
  sign_learned: { icon: Hand, label: "Learned a sign" },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No activity yet. Start learning!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 10).map((activity) => {
              const config = activityConfig[activity.activityType] ?? {
                icon: Activity,
                label: activity.activityType,
              };
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">
                      {config.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
