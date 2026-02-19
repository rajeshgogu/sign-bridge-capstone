import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  Languages,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview and stats",
  },
  {
    title: "Learn",
    href: "/learn",
    icon: BookOpen,
    description: "ISL lessons and modules",
  },
  {
    title: "Practice",
    href: "/practice",
    icon: Dumbbell,
    description: "Gesture practice and quizzes",
  },
  {
    title: "Translate",
    href: "/translate",
    icon: Languages,
    description: "Text/voice to sign translation",
  },
  {
    title: "Progress",
    href: "/progress",
    icon: TrendingUp,
    description: "Your learning progress",
  },
];
