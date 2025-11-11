import type { VideoGeneration, User } from 'wasp/entities';
import { HttpError, prisma } from 'wasp/server';
import type {
  CreateVideoGeneration,
  GetUserVideos,
  GetVideoById,
} from 'wasp/server/operations';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

//#region Actions

const createVideoGenerationInputSchema = z.object({
  referenceImageUrl: z.string().url('Please provide a valid image URL'),
  content: z.string().min(10, 'Video description must be at least 10 characters').max(500, 'Video description must be less than 500 characters'),
});

export const createVideoGeneration: CreateVideoGeneration<
  { referenceImageUrl: string; content: string },
  VideoGeneration
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be authenticated to generate videos');
  }

  // Validate input
  const validatedArgs = ensureArgsSchemaOrThrowHttpError(createVideoGenerationInputSchema, args);

  // Check if user has video credits
  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
    select: { videoCredits: true, email: true },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.videoCredits < 1) {
    throw new HttpError(400, 'Insufficient video credits. Please purchase more credits to generate videos.');
  }

  try {
    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct video credit
      await tx.user.update({
        where: { id: context.user!.id },
        data: { videoCredits: { decrement: 1 } },
      });

      // 2. Create video generation record
      const videoGeneration = await tx.videoGeneration.create({
        data: {
          userId: context.user!.id,
          referenceImageUrl: validatedArgs.referenceImageUrl,
          content: validatedArgs.content,
          status: 'PENDING',
        },
      });

      return videoGeneration;
    });

    // 3. Trigger n8n workflow (we'll implement this after webhook)
    await triggerN8nWorkflow({
      userId: context.user!.id,
      videoGenerationId: result.id,
      referenceImageUrl: validatedArgs.referenceImageUrl,
      content: validatedArgs.content,
      userEmail: user.email || '',
    });

    return result;
  } catch (error) {
    console.error('Error creating video generation:', error);
    throw new HttpError(500, 'Failed to create video generation. Please try again.');
  }
};

//#endregion

//#region Queries

export const getUserVideos: GetUserVideos<void, VideoGeneration[]> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be authenticated to view your videos');
  }

  return await prisma.videoGeneration.findMany({
    where: { 
      userId: context.user!.id,
      status: 'COMPLETED', // Only show completed videos
      finalVideoUrl: { not: null } // Ensure video URL exists
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getVideoByIdInputSchema = z.object({
  id: z.string().uuid('Invalid video ID'),
});

export const getVideoById: GetVideoById<
  { id: string },
  VideoGeneration | null
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be authenticated to view videos');
  }

  const validatedArgs = ensureArgsSchemaOrThrowHttpError(getVideoByIdInputSchema, args);

  const video = await prisma.videoGeneration.findFirst({
    where: {
      id: validatedArgs.id,
      userId: context.user!.id, // Ensure user can only access their own videos
    },
  });

  return video;
};

//#endregion

//#region Cleanup Operations

export async function cleanupOldPendingVideos(): Promise<void> {
  // Mark videos as failed if they've been pending for more than 20 minutes
  const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
  
  const updatedCount = await prisma.videoGeneration.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: twentyMinutesAgo },
    },
    data: {
      status: 'FAILED',
      updatedAt: new Date(),
    },
  });

  if (updatedCount.count > 0) {
    console.log(`Marked ${updatedCount.count} old pending videos as failed`);
  }
}

//#endregion

//#region Helper Functions

async function triggerN8nWorkflow({
  userId,
  videoGenerationId,
  referenceImageUrl,
  content,
  userEmail,
}: {
  userId: string;
  videoGenerationId: string;
  referenceImageUrl: string;
  content: string;
  userEmail: string;
}): Promise<void> {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  const n8nWebhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!n8nWebhookUrl) {
    console.error('N8N_WEBHOOK_URL not configured');
    throw new HttpError(500, 'Video generation service not configured');
  }

  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(n8nWebhookSecret && { 'Authorization': `Bearer ${n8nWebhookSecret}` }),
      },
      body: JSON.stringify({
        userId,
        videoGenerationId,
        referenceImageUrl,
        content,
        userEmail,
        webhookSecret: n8nWebhookSecret,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(`Successfully triggered n8n workflow for video generation: ${videoGenerationId}`);
  } catch (error) {
    console.error('Error triggering n8n workflow:', error);
    
    // Update video generation status to failed
    await prisma.videoGeneration.update({
      where: { id: videoGenerationId },
      data: { status: 'FAILED' },
    });

    throw new HttpError(500, 'Failed to start video generation workflow');
  }
}

//#endregion