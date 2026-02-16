"use client";

import { getCredits } from "../../actions/credits";
/**
 * Custom event type for credit updates
 */
export interface CreditsUpdateEvent extends CustomEvent {
  detail: {
    remaining: number;
  };
}

/**
 * Dispatches a custom event to notify components that credits have been updated.
 * Used when server actions directly return the remaining credits.
 * 
 * @param remainingCredits - The updated credit balance
 * 
 * @example
 * // In a component after calling an agent
 * const result = await chatbot(input, userId);
 * if (result.remainingCredits !== undefined) {
 *   notifyCreditsUpdate(result.remainingCredits);
 * }
 */
export function notifyCreditsUpdate(remainingCredits: number): void {
  if (typeof window === 'undefined') {
    console.warn('notifyCreditsUpdate called on server side, skipping');
    return;
  }

  const event = new CustomEvent('credits-updated', {
    detail: { remaining: remainingCredits }
  });
  
  window.dispatchEvent(event);
}

/**
 * Fetches the current credits from the database and dispatches an update event.
 * Used when credits were deducted in a background job (e.g., Inngest).
 * 
 * @param userId - The user ID to fetch credits for
 * 
 * @example
 * // After polling detects a background job completed
 * if (user?.id) {
 *   await refetchCredits(user.id);
 * }
 */
export async function refetchCredits(userId: string): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('refetchCredits called on server side, skipping');
    return;
  }

  try {
    const result = await getCredits(userId);
    
    if (result.success && result.credits !== undefined) {
      notifyCreditsUpdate(result.credits);
    } else {
      console.error('Failed to refetch credits:', result.error);
    }
  } catch (error) {
    console.error('Error refetching credits:', error);
  }
}
