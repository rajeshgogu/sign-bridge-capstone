import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-3 text-lg font-semibold">Sign Bridge</h3>
            <p className="text-sm text-muted-foreground">
              An interactive platform for learning Indian Sign Language through
              lessons, practice, and real-time translation.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Learn</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/learn" className="hover:text-foreground transition-colors">
                  Browse Lessons
                </Link>
              </li>
              <li>
                <Link href="/practice" className="hover:text-foreground transition-colors">
                  Practice
                </Link>
              </li>
              <li>
                <Link href="/translate" className="hover:text-foreground transition-colors">
                  Translate
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sign-in" className="hover:text-foreground transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-foreground transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Sign Bridge. Built for accessibility.</p>
        </div>
      </div>
    </footer>
  );
}
