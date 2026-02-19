"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Text Content */}
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Bridge the Communication Gap with{" "}
              <span className="text-primary">Sign Language</span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Learn Indian Sign Language through interactive lessons, real-time
              gesture recognition, and instant text-to-sign translation. Start
              your journey toward inclusive communication today.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/sign-up">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#features">Explore Features</Link>
              </Button>
            </div>
          </div>

          {/* Decorative Hand Illustration Placeholder */}
          <div className="flex items-center justify-center">
            <div className="relative aspect-square w-full max-w-md">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
              <div className="absolute inset-4 rounded-2xl bg-gradient-to-tr from-primary/30 via-primary/5 to-transparent" />
              <div className="absolute inset-8 flex items-center justify-center rounded-xl bg-gradient-to-b from-primary/10 to-transparent">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-10 text-primary"
                    >
                      <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
                      <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
                      <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
                      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Interactive Hand Tracking
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
