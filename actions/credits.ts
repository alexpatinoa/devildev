"use server";
import { db } from "@/lib/db";

/**
 * Get the current credits for a user
 */
export async function getCredits(userId: string): Promise<{ success: boolean; credits?: number; error?: string }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, credits: user.credits };
  } catch (error) {
    console.error("Error fetching user credits:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

//Deduct credits from a user based on token usage
export async function deductCredits(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  onlyOutput: boolean = false
): Promise<{ success: boolean; remaining?: number; deducted?: number; error?: string }> {
  try {
    // Calculate credits to deduct
    const creditsToDeduct = onlyOutput
      ? Math.ceil(outputTokens / 100)
      : Math.ceil(inputTokens / 500) + Math.ceil(outputTokens / 100);

    if (creditsToDeduct === 0) {
      // No tokens used, no deduction needed
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { credits: true }
      });
      return { success: true, remaining: user?.credits ?? 0, deducted: 0 };
    }

    // Deduct credits
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { credits: { decrement: creditsToDeduct } },
      select: { credits: true }
    });

    console.log(`Deducted ${creditsToDeduct} credits from user ${userId}. Remaining: ${updatedUser.credits}`);

    return { 
      success: true, 
      remaining: updatedUser.credits,
      deducted: creditsToDeduct
    };
  } catch (error) {
    console.error("Error deducting credits:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Check if user has sufficient credits (at least 1 credit)
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const result = await getCredits(userId);
  return result.success && (result.credits ?? 0) > 0;
}
