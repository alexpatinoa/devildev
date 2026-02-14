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
  body: any;
  githubIssue: any;
  createdAt: Date;
  updatedAt: Date;
}

export async function createPact(
  projectId: string,
  type: PactType,
  head: string,
  body?: any
) {

   // FORCE plain JSON serialization
   const safeBody =
   body == null ? null : JSON.parse(JSON.stringify(body));
   
  try {
    const pact = await db.pact.create({
      data: {
        projectId,
        type,
        head,
        body: safeBody || null,
        status: 'PENDING',
      }
    });

    return { success: true, pact };
  } catch (error) {
    console.error('Error creating pact:', error);
    return { error: 'Failed to create pact' };
  }
}

export async function updatePact(
  pactId: string,
  head: string,
  body?: any
) {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  // Verify the pact belongs to user's project
  const pact = await db.pact.findUnique({
    where: { id: pactId },
    include: { project: { select: { userId: true } } }
  });

  if (!pact || pact.project.userId !== userId) {
    return { error: 'Pact not found or unauthorized' };
  }

  try {
    const updatedPact = await db.pact.update({
      where: { id: pactId },
      data: {
        head,
        body: body || null,
        updatedAt: new Date()
      }
    });

    return { success: true, pact: updatedPact };
  } catch (error) {
    console.error('Error updating pact:', error);
    return { error: 'Failed to update pact' };
  }
}

/**
 * Update pact status
 */
export async function updatePactStatus(
  pactId: string,
  status: PactStatus
) {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  // Verify the pact belongs to user's project
  const pact = await db.pact.findUnique({
    where: { id: pactId },
    include: { project: { select: { userId: true } } }
  });

  if (!pact || pact.project.userId !== userId) {
    return { error: 'Pact not found or unauthorized' };
  }

  try {
    const updatedPact = await db.pact.update({
      where: { id: pactId },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    return { success: true, pact: updatedPact };
  } catch (error) {
    console.error('Error updating pact status:', error);
    return { error: 'Failed to update pact status' };
  }
}


export async function deletePact(pactId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const pact = await db.pact.findUnique({
    where: { id: pactId },
    include: { project: { select: { userId: true } } }
  });

  if (!pact || pact.project.userId !== userId) {
    return { error: 'Pact not found or unauthorized' };
  }

  try {
    await db.pact.delete({
      where: { id: pactId }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting pact:', error);
    return { error: 'Failed to delete pact' };
  }
}

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
