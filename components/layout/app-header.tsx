"use client";

import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";

  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    learn: "Learn",
    practice: "Practice",
    translate: "Translate",
    progress: "Progress",
    profile: "Profile",
    settings: "Settings",
    gesture: "Gesture Practice",
    quiz: "Quiz",
    "text-to-sign": "Text to Sign",
    "sign-to-text": "Sign to Text",
    results: "Results",
  };

  const lastSegment = segments[segments.length - 1];
  return titles[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
}

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{getPageTitle(pathname)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
