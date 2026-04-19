import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const practiceOptions = [
  {
    title: "Gesture Recognition Practice",
    description: "Practice signs using your camera and get real-time feedback.",
    href: "/practice/gesture",
  },
  {
    title: "Quiz",
    description: "Test your sign language knowledge with interactive quizzes.",
    href: "/practice/quiz",
  },
  {
    title: "Phrases Practice",
    description: "Learn and practice common sign language phrases with your camera.",
    href: "/practice/phrases",
  },
];

export default function PracticePage() {
  return (
    <div>
      <PageHeader
        title="Practice"
        description="Sharpen your sign language skills."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {practiceOptions.map((option) => (
          <Link key={option.href} href={option.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Click to start</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
