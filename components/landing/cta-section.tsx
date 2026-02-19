import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-16 text-center text-primary-foreground shadow-lg sm:px-12 md:py-24">
          {/* Subtle decorative background shapes */}
          <div className="absolute -left-16 -top-16 size-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -right-20 size-80 rounded-full bg-white/5" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Start Your Sign Language Journey?
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/80">
              Join thousands of learners who are breaking communication barriers
              and building connections through Indian Sign Language. Create your
              free account and start learning today.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="font-semibold"
            >
              <Link href="/sign-up">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
