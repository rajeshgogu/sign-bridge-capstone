export function calculateCompletionPercentage(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getLessonStatus(
  completedSigns: number,
  totalSigns: number
): "not_started" | "in_progress" | "completed" {
  if (completedSigns === 0) return "not_started";
  if (completedSigns >= totalSigns) return "completed";
  return "in_progress";
}
