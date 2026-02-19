import {
  BookOpen,
  Camera,
  Languages,
  Brain,
  BarChart3,
  Accessibility,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: BookOpen,
    title: "Interactive Lessons",
    description:
      "Structured ISL curriculum from the alphabet to everyday phrases, designed for learners at every level.",
  },
  {
    icon: Camera,
    title: "Gesture Recognition",
    description:
      "Real-time hand tracking with your camera to practice signs and get instant feedback on your accuracy.",
  },
  {
    icon: Languages,
    title: "Text to Sign",
    description:
      "Convert text and voice input to sign language animations, making communication seamless and accessible.",
  },
  {
    icon: Brain,
    title: "Quizzes & Practice",
    description:
      "Test your knowledge with interactive quizzes that adapt to your skill level and reinforce learning.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Monitor your learning journey with detailed stats, streaks, and milestones to keep you motivated.",
  },
  {
    icon: Accessibility,
    title: "Accessible Design",
    description:
      "Built for everyone with full keyboard navigation and screen reader support from the ground up.",
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Learn ISL
          </h2>
          <p className="text-lg text-muted-foreground">
            A comprehensive platform with tools and features designed to make
            learning Indian Sign Language effective and enjoyable.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className={cn(
                "transition-shadow duration-300 hover:shadow-md"
              )}
            >
              <CardHeader>
                <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
