import { cn } from "@/lib/utils";

const steps = [
  {
    number: 1,
    title: "Sign Up",
    description:
      "Create your free account to start learning ISL. No credit card required -- just your willingness to learn.",
  },
  {
    number: 2,
    title: "Learn & Practice",
    description:
      "Follow structured lessons and practice with your camera. Get real-time feedback on your signing accuracy.",
  },
  {
    number: 3,
    title: "Track Progress",
    description:
      "Monitor your skills and earn streaks as you improve. Celebrate milestones and stay motivated every day.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section className="bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting started with Sign Bridge is simple. Follow these three steps
            and begin your sign language journey.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* Connecting line for desktop */}
          <div className="absolute left-0 right-0 top-16 hidden h-0.5 bg-border md:block" />

          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center"
              >
                {/* Number badge */}
                <div
                  className={cn(
                    "relative z-10 mb-6 flex size-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-sm"
                  )}
                >
                  {step.number}
                </div>

                {/* Arrow indicators between steps on desktop */}
                {index < steps.length - 1 && (
                  <div className="absolute left-[calc(50%+2rem)] top-[3.25rem] hidden -translate-y-1/2 md:block">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                )}

                <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                <p className="max-w-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
