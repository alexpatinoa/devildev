"use client";
import React, { useEffect, useState } from 'react';
import { useUser } from "@clerk/nextjs";
import { getCredits } from "../../../actions/credits";
import { GiSoulVessel } from "react-icons/gi";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

export default function SoulCount() {
  const { user, isLoaded } = useUser();
  const [souls, setSouls] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSouls = async () => {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        const result = await getCredits(user.id);
        if (result.success && result.credits !== undefined) {
          setSouls(result.credits);
        }
      } catch (error) {
        console.error("Error fetching souls:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSouls();
  }, [user, isLoaded]);

  // Listen for credit update events
  useEffect(() => {
    const handleCreditsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ remaining: number }>;
      setSouls(customEvent.detail.remaining);
    };

    window.addEventListener('credits-updated', handleCreditsUpdate);
    
    return () => {
      window.removeEventListener('credits-updated', handleCreditsUpdate);
    };
  }, []);

  if (!isLoaded || !user) {
    return null;
  }

  return (
    <HoverCard openDelay={0.25}>
      <HoverCardTrigger asChild>
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-gray-700/50 hover:border-gray-600/50 cursor-help transition-colors duration-200"
          style={{
            boxShadow: '0 0 12px rgba(255, 255, 255, 0.2), 0 0 20px rgba(255, 255, 255, 0.1)'
          }}
        >
          <GiSoulVessel className="w-5 h-5 text-white" />
          <span className="text-sm font-medium text-gray-200">
            {loading ? "..." : souls ?? 0}
          </span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        align="end" 
        className="relative w-72 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black/90 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.75)] ring-1 ring-red-500/10 transition-all duration-300 ease-out hover:ring-red-400/20 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_110px_rgba(0,0,0,0.78)] before:pointer-events-none before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-300 before:bg-[radial-gradient(800px_circle_at_12%_10%,rgba(239,68,68,0.20),transparent_55%),radial-gradient(700px_circle_at_90%_35%,rgba(244,63,94,0.12),transparent_52%)] data-[state=open]:before:opacity-100 after:pointer-events-none after:absolute after:inset-[-2px] after:rounded-[14px] after:opacity-70 after:blur-xl after:bg-[conic-gradient(from_180deg_at_50%_50%,rgba(239,68,68,0.10),rgba(244,63,94,0.10),rgba(251,146,60,0.08),rgba(239,68,68,0.10))]"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GiSoulVessel className="w-5 h-5 text-red-300 drop-shadow-[0_0_14px_rgba(239,68,68,0.55)]" />
            <h3 className="text-sm font-semibold text-white">Soul Count</h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Your soul count represents credits consumed during AI operations. Each chat message and architecture generation consumes souls based on token usage.
          </p>
          <div className="pt-2 border-t border-gray-700/50">
            <p className="text-xs text-gray-400">
              <span className="text-red-300 font-medium">Current:</span>{' '}
              {loading ? "..." : souls ?? 0} souls remaining
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
