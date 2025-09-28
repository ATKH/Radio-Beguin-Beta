'use client';

import React, { useEffect } from "react";
import { usePlayer } from "@/lib/PlayerContext";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { currentEpisode } = usePlayer();

  // Si besoin de déclencher des effets lorsque le podcast change
  useEffect(() => {
    if (currentEpisode) {
      // Par exemple scroll ou focus sur le Player
    }
  }, [currentEpisode]);

  return <>{children}</>;
}
