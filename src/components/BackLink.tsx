"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  href?: string;
  label?: string;
  className?: string;
}

export default function BackLink({ href = "/shows", label = "Retour", className }: BackLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(href);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
