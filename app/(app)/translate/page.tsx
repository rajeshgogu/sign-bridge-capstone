import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const translateOptions = [
  {
    title: "Text / Voice to Sign",
    description: "Convert text or voice input into sign language animations.",
    href: "/translate/text-to-sign",
  },
  {
    title: "Sign to Text",
    description:
      "Use your camera to capture signs and translate them into text.",
    href: "/translate/sign-to-text",
  },
];

export default function TranslatePage() {
  return (
    <div>
      <PageHeader
        title="Translate"
        description="Translate between text, voice, and sign language."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {translateOptions.map((option) => (
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
