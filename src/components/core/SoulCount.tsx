"use client";
import React, { useEffect, useState } from 'react';
import { useUser } from "@clerk/nextjs";
import { getCredits } from "../../../actions/credits";
import { GiSoulVessel } from "react-icons/gi";

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
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-gray-700/50 hover:border-gray-600/50"
      style={{
        boxShadow: '0 0 12px rgba(255, 255, 255, 0.2), 0 0 20px rgba(255, 255, 255, 0.1)'
      }}
    >
      <GiSoulVessel className="w-5 h-5 text-white" />
      <span className="text-sm font-medium text-gray-200">
        {loading ? "..." : souls ?? 0}
      </span>
    </div>
  );
}
