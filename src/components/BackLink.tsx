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

export default function BackLink({ href = "/shows", label = "retour", className }: BackLinkProps) {
  const router = useRouter();
  const FALLBACK_QUERY_KEY = "shows:last-query";

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (typeof window !== "undefined") {
      const cancelFallback = () => {
        window.clearTimeout(fallbackTimer);
        window.removeEventListener("popstate", cancelFallback);
      };

      const fallbackTimer = window.setTimeout(() => {
        cancelFallback();
        let target = href;
        if (href === "/shows") {
          const storedQuery = window.sessionStorage.getItem(FALLBACK_QUERY_KEY);
          if (storedQuery) {
            target = `${href}${storedQuery}`;
          }
        }
        router.push(target);
      }, 200);

      window.addEventListener("popstate", cancelFallback);
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
        "inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className
      )}
      aria-label={label}
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
