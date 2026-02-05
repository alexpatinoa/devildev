"use server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { cache } from "react";

export type PactType = 'BUG' | 'TASK' | 'FEATURE';
export type PactStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Pact {
  id: string;
  projectId: string;
  type: PactType;
  status: PactStatus;
  head: string;
  body: string | null;
  githubIssue: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new pact for a project
 */
export async function createPact(
  projectId: string,
  type: PactType,
  head: string,
  body?: string
) {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  // Verify the project belongs to the user
  const project = await db.project.findUnique({
    where: { id: projectId, userId: userId },
    select: { id: true }
  });

  if (!project) {
    return { error: 'Project not found or unauthorized' };
  }

  try {
    const pact = await db.pact.create({
      data: {
        projectId,
        type,
        head,
        body: body || null,
        status: 'PENDING',
      }
    });

    return { success: true, pact };
  } catch (error) {
    console.error('Error creating pact:', error);
    return { error: 'Failed to create pact' };
  }
}

/**
 * Get pacts for a project, optionally filtered by type
 */
export const getPactsByProject = cache(async (projectId: string, type?: PactType) => {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  try {
    const pacts = await db.pact.findMany({
      where: {
        projectId,
        ...(type && { type })
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { success: true, pacts };
  } catch (error) {
    console.error('Error fetching pacts:', error);
    return { error: 'Failed to fetch pacts' };
  }
});
