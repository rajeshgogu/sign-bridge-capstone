"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SignData } from "@/types";

interface SignCardProps {
  sign: SignData;
  learned?: boolean;
  onClick?: () => void;
}

export function SignCard({ sign, learned, onClick }: SignCardProps) {
  return (
    <Card
      className={cn(
        "relative cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        learned && "border-green-500/30"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="p-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-md">
          {sign.imageUrl ? (
            <Image
              src={sign.imageUrl}
              alt={sign.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 150px"
            />
          ) : (
            <div
              className={cn(
                "flex size-full items-center justify-center bg-muted text-muted-foreground text-2xl font-bold"
              )}
            >
              {sign.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-1">
          <span className="truncate text-sm font-medium">{sign.name}</span>
          {learned && (
            <Badge
              variant="default"
              className="shrink-0 bg-green-600 text-white hover:bg-green-600"
            >
              <CheckCircle2 className="size-3" />
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
