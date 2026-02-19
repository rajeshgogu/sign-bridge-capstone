import { PageHeader } from "@/components/shared/page-header";

export default async function QuizResultsPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;

  return (
    <div>
      <PageHeader title="Quiz Results" description="See how you did." />

      <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
        <p className="text-muted-foreground">
          Results for quiz &quot;{quizId}&quot; will appear here. Coming soon.
        </p>
      </div>
    </div>
  );
}
