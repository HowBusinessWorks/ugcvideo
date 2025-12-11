import type { VideoGeneration, User } from 'wasp/entities';
import { HttpError, prisma } from 'wasp/server';
import type {
  CreateVideoGeneration,
  GetUserVideos,
  GetVideoById,
} from 'wasp/server/operations';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';
import { CREDIT_COSTS } from '../payment/plans';
import { getDownloadFileSignedURLFromS3 } from '../file-upload/s3Utils';
import {
  ErrorType,
  markGenerationAsFailed,
  processRefund,
  autoRefundFailedGenerations,
  getCreditsToRefund
} from './errorHandling';

//#region Signed URL Cache

// Simple in-memory cache for signed URLs (valid for 50 minutes, renewed before expiration)
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_DURATION_MS = 50 * 60 * 1000; // 50 minutes (URLs are valid for 1 hour)

async function getCachedSignedUrl(s3Key: string): Promise<string> {
  const now = Date.now();
  const cached = signedUrlCache.get(s3Key);

  // Return cached URL if still valid
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  // Generate new signed URL
  const url = await getDownloadFileSignedURLFromS3({ key: s3Key });

  // Cache it
  signedUrlCache.set(s3Key, {
    url,
    expiresAt: now + CACHE_DURATION_MS,
  });

  return url;
}

// Clean up expired cache entries periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of signedUrlCache.entries()) {
    if (value.expiresAt <= now) {
      signedUrlCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

//#endregion

//#region Actions

// ===== NEW ACTIONS FOR TAB-BASED ARCHITECTURE =====

// Person Generation (Stage 1 only) - Generates ONLY the person, no product
const createPersonGenerationInputSchema = z.object({
  mode: z.enum(['EASY', 'ADVANCED']),
  personFields: z.object({
    gender: z.string(),
    age: z.string(),
    ethnicity: z.string(),
    clothing: z.string(),
    expression: z.string(),
    background: z.string(),
  }).optional(),
  personPrompt: z.string().optional(),
});

type CreatePersonGenerationInput = z.infer<typeof createPersonGenerationInputSchema>;

export const createPersonGeneration = async (
  args: CreatePersonGenerationInput,
  context: any
): Promise<VideoGeneration> => {
  if (!context.user) {
    throw new HttpError(401, 'You must be authenticated to generate persons');
  }

  // Validate input
  const validatedArgs = ensureArgsSchemaOrThrowHttpError(createPersonGenerationInputSchema, args);

  // Check credits (1 credit for person generation)
  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
    select: { videoCredits: true },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.videoCredits < CREDIT_COSTS.PERSON) {
    throw new HttpError(400, `Insufficient credits. Need at least ${CREDIT_COSTS.PERSON} credit${CREDIT_COSTS.PERSON > 1 ? 's' : ''} for person generation.`);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Deduct 1 credit
      await tx.user.update({
        where: { id: context.user!.id },
        data: { videoCredits: { decrement: CREDIT_COSTS.PERSON } },
      });

      // Create VideoGeneration record with assetType: PERSON
      const generation = await tx.videoGeneration.create({
        data: {
          userId: context.user!.id,
          assetType: 'PERSON',
          stage1Mode: validatedArgs.mode,
          personPrompt: validatedArgs.personPrompt,
          personGender: validatedArgs.personFields?.gender,
          personAge: validatedArgs.personFields?.age,
          personEthnicity: validatedArgs.personFields?.ethnicity,
          personClothing: validatedArgs.personFields?.clothing,
          personExpression: validatedArgs.personFields?.expression,
          personBackground: validatedArgs.personFields?.background,
          status: 'PENDING',
        },
      });

      return generation;
    });

    // Call Python backend
    await triggerPythonBackendPersonGeneration({
      userId: context.user!.id,
      generationId: result.id,
      mode: validatedArgs.mode,
      personFields: validatedArgs.personFields,
      personPrompt: validatedArgs.personPrompt,
    });

    return result;
  } catch (error) {
    console.error('Error creating person generation:', error);
    throw new HttpError(500, 'Failed to create person generation. Please try again.');
  }
};

// Composite Generation (Stage 2 only)
const createCompositeGenerationInputSchema = z.object({
  personImageUrl: z.string().url('Please provide a valid person image URL'),
  productImageUrl: z.string().url('Please provide a valid product image URL'),
  compositePrompt: z.string().optional(),
});

type CreateCompositeGenerationInput = z.infer<typeof createCompositeGenerationInputSchema>;

export const createCompositeGeneration = async (
  args: CreateCompositeGenerationInput,
  context: any
): Promise<VideoGeneration> => {
  if (!context.user) {
    throw new HttpError(401, 'You must be authenticated to generate composites');
  }

  // Validate input
  const validatedArgs = ensureArgsSchemaOrThrowHttpError(createCompositeGenerationInputSchema, args);

  // Check credits (1 credit for composite generation)
  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
    select: { videoCredits: true },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.videoCredits < CREDIT_COSTS.COMPOSITE) {
    throw new HttpError(400, `Insufficient credits. Need at least ${CREDIT_COSTS.COMPOSITE} credit${CREDIT_COSTS.COMPOSITE > 1 ? 's' : ''} for composite generation.`);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Deduct 1 credit
      await tx.user.update({
        where: { id: context.user!.id },
        data: { videoCredits: { decrement: CREDIT_COSTS.COMPOSITE } },
      });

      // Create VideoGeneration record with assetType: COMPOSITE
      const generation = await tx.videoGeneration.create({
        data: {
          userId: context.user!.id,
          assetType: 'COMPOSITE',
          productImageUrl: validatedArgs.productImageUrl,
          compositePrompt: validatedArgs.compositePrompt,
          // Store person image URL temporarily in generatedPersonUrl
          generatedPersonUrl: validatedArgs.personImageUrl,
          status: 'PENDING',
        },
      });

      return generation;
    });

    // Call Python backend
    await triggerPythonBackendCompositeGeneration({
      userId: context.user!.id,
      generationId: result.id,
      personImageUrl: validatedArgs.personImageUrl,
      productImageUrl: validatedArgs.productImageUrl,
      compositePrompt: validatedArgs.compositePrompt,
    });

    return result;
  } catch (error) {
    console.error('Error creating composite generation:', error);
    throw new HttpError(500, 'Failed to create composite generation. Please try again.');
  }
};

// Video Generation (Stage 3 only)
const createVideoOnlyGenerationInputSchema = z.object({
  compositeImageUrl: z.string().url('Please provide a valid composite image URL'),
  videoPrompt: z.string().min(10, 'Video prompt must be at least 10 characters').max(500),
  veo3Mode: z.enum(['FAST', 'STANDARD']).default('STANDARD'),
  duration: z.number().default(8),
  aspectRatio: z.string().default('9:16'),
  productImageUrl: z.string().url().optional(),  // NEW: For GPT-4o enhancement
});

type CreateVideoOnlyGenerationInput = z.infer<typeof createVideoOnlyGenerationInputSchema>;

export const createVideoOnlyGeneration = async (
  args: CreateVideoOnlyGenerationInput,
  context: any
): Promise<VideoGeneration> => {
  if (!context.user) {
    throw new HttpError(401, 'You must be authenticated to generate videos');
  }

  // Validate input
  const validatedArgs = ensureArgsSchemaOrThrowHttpError(createVideoOnlyGenerationInputSchema, args);

  // Determine credit cost based on video quality
  const requiredCredits = validatedArgs.veo3Mode === 'FAST' ? CREDIT_COSTS.VIDEO_FAST : CREDIT_COSTS.VIDEO_STANDARD;

  // Check credits (12 credits for Fast, 32 credits for Standard)
  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
    select: { videoCredits: true },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.videoCredits < requiredCredits) {
    throw new HttpError(400, `Insufficient credits. Need at least ${requiredCredits} credits for video generation (${validatedArgs.veo3Mode} quality).`);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Deduct credits based on quality
      await tx.user.update({
        where: { id: context.user!.id },
        data: { videoCredits: { decrement: requiredCredits } },
      });

      // Create VideoGeneration record with assetType: VIDEO
      const generation = await tx.videoGeneration.create({
        data: {
          userId: context.user!.id,
          assetType: 'VIDEO',
          videoPrompt: validatedArgs.videoPrompt,
          veo3Mode: validatedArgs.veo3Mode,
          // Store composite image URL temporarily in compositeImageUrl
          compositeImageUrl: validatedArgs.compositeImageUrl,
          status: 'PENDING',
        },
      });

      return generation;
    });

    // Call Python backend
    await triggerPythonBackendVideoGeneration({
      userId: context.user!.id,
      generationId: result.id,
      compositeImageUrl: validatedArgs.compositeImageUrl,
      videoPrompt: validatedArgs.videoPrompt,
      veo3Mode: validatedArgs.veo3Mode,
      duration: validatedArgs.duration,
      aspectRatio: validatedArgs.aspectRatio,
      productImageUrl: validatedArgs.productImageUrl,  // NEW: For GPT-4o enhancement
    });

    return result;
  } catch (error) {
    console.error('Error creating video generation:', error);
    throw new HttpError(500, 'Failed to create video generation. Please try again.');
  }
};

// === ORIGINAL FULL PIPELINE ACTION (legacy) ===

// New schema for 3-stage pipeline
const createVideoGenerationInputSchema = z.object({
  // Mode selection
  mode: z.enum(['EASY', 'ADVANCED']).default('EASY'),

  // Stage 1: Person generation (EASY mode)
  personFields: z.object({
    gender: z.string(),
    age: z.string(),
    ethnicity: z.string(),
    clothing: z.string(),
    expression: z.string(),
    background: z.string(),
  }).optional(),

  // Stage 1: Person generation (ADVANCED mode)
  personPrompt: z.string().optional(),

  // Stage 2: Product compositing
  productImageUrl: z.string().url('Please provide a valid product image URL'),
  compositePrompt: z.string().optional(),

  // Stage 3: Video generation
  videoPrompt: z.string().min(10, 'Video prompt must be at least 10 characters').max(500),
  veo3Mode: z.enum(['FAST', 'STANDARD']).default('STANDARD'),
  duration: z.number().default(8),
  aspectRatio: z.string().default('9:16'),
});

type CreateVideoGenerationInput = z.infer<typeof createVideoGenerationInputSchema>;

export const createVideoGeneration: CreateVideoGeneration<
  CreateVideoGenerationInput,
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

  if (user.videoCredits < 3) {
    throw new HttpError(400, 'Insufficient video credits. Need at least 3 credits for full pipeline (0.5 + 0.5 + 2).');
  }

  try {
    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct 3 video credits (0.5 person + 0.5 composite + 2 video)
      await tx.user.update({
        where: { id: context.user!.id },
        data: { videoCredits: { decrement: 3 } },
      });

      // 2. Create video generation record with new 3-stage pipeline fields
      const videoGeneration = await tx.videoGeneration.create({
        data: {
          userId: context.user!.id,
          // Stage 1 fields
          stage1Mode: validatedArgs.mode,
          personPrompt: validatedArgs.personPrompt,
          personGender: validatedArgs.personFields?.gender,
          personAge: validatedArgs.personFields?.age,
          personEthnicity: validatedArgs.personFields?.ethnicity,
          personClothing: validatedArgs.personFields?.clothing,
          personExpression: validatedArgs.personFields?.expression,
          personBackground: validatedArgs.personFields?.background,

          // Stage 2 fields
          productImageUrl: validatedArgs.productImageUrl,
          compositePrompt: validatedArgs.compositePrompt,

          // Stage 3 fields
          videoPrompt: validatedArgs.videoPrompt,
          veo3Mode: validatedArgs.veo3Mode,

          // Legacy field for backwards compatibility
          content: validatedArgs.videoPrompt,

          status: 'PENDING',
        },
      });

      return videoGeneration;
    });

    // 3. Trigger Python backend 3-stage pipeline
    await triggerPythonBackend({
      userId: context.user!.id,
      videoGenerationId: result.id,
      mode: validatedArgs.mode,
      personFields: validatedArgs.personFields,
      personPrompt: validatedArgs.personPrompt,
      productImageUrl: validatedArgs.productImageUrl,
      compositePrompt: validatedArgs.compositePrompt,
      videoPrompt: validatedArgs.videoPrompt,
      veo3Mode: validatedArgs.veo3Mode,
      duration: validatedArgs.duration,
      aspectRatio: validatedArgs.aspectRatio,
    });

    return result;
  } catch (error) {
    console.error('Error creating video generation:', error);
    throw new HttpError(500, 'Failed to create video generation. Please try again.');
  }
};

// Request refund for a failed generation
const requestRefundInputSchema = z.object({
  generationId: z.string().uuid('Invalid generation ID'),
});

export const requestRefund = async (
  args: { generationId: string },
  context: any
): Promise<{ success: boolean; creditsRefunded: number; message: string }> => {
  if (!context.user) {
    throw new HttpError(401, 'You must be authenticated to request refunds');
  }

  const validatedArgs = ensureArgsSchemaOrThrowHttpError(requestRefundInputSchema, args);

  // Verify the generation belongs to the user
  const generation = await prisma.videoGeneration.findFirst({
    where: {
      id: validatedArgs.generationId,
      userId: context.user.id,
    },
  });

  if (!generation) {
    throw new HttpError(404, 'Generation not found or does not belong to you');
  }

  // Check if generation is failed and refundable
  if (generation.status !== 'FAILED') {
    throw new HttpError(400, 'Only failed generations can be refunded');
  }

  if (!generation.isRefundable) {
    throw new HttpError(400, 'This generation is not eligible for refund (user error or validation error)');
  }

  if (generation.creditsRefunded) {
    throw new HttpError(400, 'Credits have already been refunded for this generation');
  }

  // Process the refund
  try {
    const result = await processRefund(validatedArgs.generationId);

    if (result.success) {
      return {
        success: true,
        creditsRefunded: result.creditsRefunded,
        message: `Successfully refunded ${result.creditsRefunded} credits`,
      };
    } else {
      throw new HttpError(400, 'Failed to process refund. Please contact support.');
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new HttpError(500, 'Failed to process refund. Please try again or contact support.');
  }
};

// Retry a failed generation
const retryGenerationInputSchema = z.object({
  generationId: z.string().uuid('Invalid generation ID'),
});

export const retryGeneration = async (
  args: { generationId: string },
  context: any
): Promise<VideoGeneration> => {
  if (!context.user) {
    throw new HttpError(401, 'You must be authenticated to retry generations');
  }

  const validatedArgs = ensureArgsSchemaOrThrowHttpError(retryGenerationInputSchema, args);

  // Verify the generation belongs to the user
  const generation = await prisma.videoGeneration.findFirst({
    where: {
      id: validatedArgs.generationId,
      userId: context.user.id,
    },
  });

  if (!generation) {
    throw new HttpError(404, 'Generation not found or does not belong to you');
  }

  // Check if generation can be retried
  if (generation.status !== 'FAILED') {
    throw new HttpError(400, 'Only failed generations can be retried');
  }

  if (!generation.canRetry) {
    throw new HttpError(400, 'This generation cannot be retried');
  }

  // Check credits (depends on asset type)
  let requiredCredits = 0;
  switch (generation.assetType) {
    case 'PERSON':
      requiredCredits = CREDIT_COSTS.PERSON;
      break;
    case 'COMPOSITE':
      requiredCredits = CREDIT_COSTS.COMPOSITE;
      break;
    case 'VIDEO':
      requiredCredits = generation.veo3Mode === 'FAST' ? CREDIT_COSTS.VIDEO_FAST : CREDIT_COSTS.VIDEO_STANDARD;
      break;
    case 'FULL_PIPELINE':
      requiredCredits = 3; // Full pipeline cost
      break;
  }

  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
    select: { videoCredits: true },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.videoCredits < requiredCredits) {
    throw new HttpError(400, `Insufficient credits. Need at least ${requiredCredits} credits to retry.`);
  }

  try {
    // Deduct credits and reset generation status
    const updatedGeneration = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: context.user!.id },
        data: { videoCredits: { decrement: requiredCredits } },
      });

      // Reset generation to pending state
      return await tx.videoGeneration.update({
        where: { id: validatedArgs.generationId },
        data: {
          status: 'PENDING',
          errorType: null,
          errorMessage: null,
          isRefundable: false,
          updatedAt: new Date(),
        },
      });
    });

    // Re-trigger the appropriate backend call based on asset type
    switch (generation.assetType) {
      case 'PERSON':
        await triggerPythonBackendPersonGeneration({
          userId: context.user.id,
          generationId: generation.id,
          mode: generation.stage1Mode!,
          personFields: generation.personGender ? {
            gender: generation.personGender,
            age: generation.personAge!,
            ethnicity: generation.personEthnicity!,
            clothing: generation.personClothing!,
            expression: generation.personExpression!,
            background: generation.personBackground!,
          } : undefined,
          personPrompt: generation.personPrompt ?? undefined,
        });
        break;

      case 'COMPOSITE':
        await triggerPythonBackendCompositeGeneration({
          userId: context.user.id,
          generationId: generation.id,
          personImageUrl: generation.generatedPersonUrl!,
          productImageUrl: generation.productImageUrl!,
          compositePrompt: generation.compositePrompt ?? undefined,
        });
        break;

      case 'VIDEO':
        await triggerPythonBackendVideoGeneration({
          userId: context.user.id,
          generationId: generation.id,
          compositeImageUrl: generation.compositeImageUrl!,
          videoPrompt: generation.videoPrompt!,
          veo3Mode: generation.veo3Mode!,
          duration: generation.duration,
          aspectRatio: generation.aspectRatio,
        });
        break;

      case 'FULL_PIPELINE':
        await triggerPythonBackend({
          userId: context.user.id,
          videoGenerationId: generation.id,
          mode: generation.stage1Mode!,
          personFields: generation.personGender ? {
            gender: generation.personGender,
            age: generation.personAge!,
            ethnicity: generation.personEthnicity!,
            clothing: generation.personClothing!,
            expression: generation.personExpression!,
            background: generation.personBackground!,
          } : undefined,
          personPrompt: generation.personPrompt ?? undefined,
          productImageUrl: generation.productImageUrl!,
          compositePrompt: generation.compositePrompt ?? undefined,
          videoPrompt: generation.videoPrompt!,
          veo3Mode: generation.veo3Mode!,
          duration: generation.duration,
          aspectRatio: generation.aspectRatio,
        });
        break;
    }

    return updatedGeneration;
  } catch (error) {
    console.error('Error retrying generation:', error);
    throw new HttpError(500, 'Failed to retry generation. Please try again.');
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

const getUserAssetsInputSchema = z.object({
  assetType: z.enum(['PERSON', 'COMPOSITE', 'VIDEO', 'FULL_PIPELINE', 'ALL']).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(12), // 12 assets per page
});

type GetUserAssetsResponse = {
  assets: VideoGeneration[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
};

export const getUserAssets = async (
  args: {
    assetType?: 'PERSON' | 'COMPOSITE' | 'VIDEO' | 'FULL_PIPELINE' | 'ALL';
    page?: number;
    pageSize?: number;
  },
  context: any
): Promise<GetUserAssetsResponse> => {
  if (!context.user) {
    throw new HttpError(401, 'You must be authenticated to view your assets');
  }

  const validatedArgs = ensureArgsSchemaOrThrowHttpError(getUserAssetsInputSchema, args);

  // Build where clause based on filter
  const whereClause: any = {
    userId: context.user!.id,
    status: { in: ['COMPLETED', 'FAILED'] }, // Show both completed and failed generations
  };

  // Add asset type filter if specified (and not 'ALL')
  if (validatedArgs.assetType && validatedArgs.assetType !== 'ALL') {
    whereClause.assetType = validatedArgs.assetType;
  }

  // Calculate pagination
  const skip = (validatedArgs.page - 1) * validatedArgs.pageSize;
  const take = validatedArgs.pageSize;

  // Get total count for pagination
  const totalCount = await prisma.videoGeneration.count({
    where: whereClause,
  });

  const assets = await prisma.videoGeneration.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });

  // Generate fresh signed URLs for S3 assets (with caching for performance)
  const assetsWithSignedUrls = await Promise.all(
    assets.map(async (asset) => {
      const updatedAsset = { ...asset };

      // Generate signed URL for person image if S3 key exists
      if (asset.s3KeyPerson) {
        try {
          updatedAsset.generatedPersonUrl = await getCachedSignedUrl(asset.s3KeyPerson);
        } catch (error) {
          console.error(`Error generating signed URL for person image ${asset.id}:`, error);
        }
      }

      // Generate signed URL for composite image if S3 key exists
      if (asset.s3KeyComposite) {
        try {
          updatedAsset.compositeImageUrl = await getCachedSignedUrl(asset.s3KeyComposite);
        } catch (error) {
          console.error(`Error generating signed URL for composite image ${asset.id}:`, error);
        }
      }

      // Generate signed URL for video if S3 key exists
      if (asset.s3KeyVideo) {
        try {
          updatedAsset.finalVideoUrl = await getCachedSignedUrl(asset.s3KeyVideo);
        } catch (error) {
          console.error(`Error generating signed URL for video ${asset.id}:`, error);
        }
      }

      return updatedAsset;
    })
  );

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / validatedArgs.pageSize);
  const hasMore = validatedArgs.page < totalPages;

  return {
    assets: assetsWithSignedUrls,
    totalCount,
    currentPage: validatedArgs.page,
    totalPages,
    hasMore,
  };
};

// Query: Get pending generation for a specific asset type (for restoring loading state)
const getPendingGenerationInputSchema = z.object({
  assetType: z.enum(['PERSON', 'COMPOSITE', 'VIDEO', 'FULL_PIPELINE']),
});

export const getPendingGeneration = async (
  args: { assetType: string },
  context: any
): Promise<VideoGeneration | null> => {
  if (!context.user) {
    throw new HttpError(401, 'You must be authenticated');
  }

  const validatedArgs = ensureArgsSchemaOrThrowHttpError(getPendingGenerationInputSchema, args);

  // Find the most recent PENDING generation for this user and asset type
  const pendingGeneration = await prisma.videoGeneration.findFirst({
    where: {
      userId: context.user!.id,
      assetType: validatedArgs.assetType,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  return pendingGeneration;
};

//#endregion

//#region Cleanup Operations

export async function cleanupOldPendingVideos(): Promise<void> {
  // Find videos that have been pending for more than 20 minutes
  const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

  const timedOutGenerations = await prisma.videoGeneration.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: twentyMinutesAgo },
    },
  });

  // Mark each as failed with TIMEOUT error type (refundable)
  for (const generation of timedOutGenerations) {
    try {
      await markGenerationAsFailed({
        generationId: generation.id,
        errorType: ErrorType.TIMEOUT,
        errorMessage: 'Generation timed out after 20 minutes',
      });
      console.log(`⏱️  Marked generation ${generation.id} as timed out`);
    } catch (error) {
      console.error(`Failed to mark generation ${generation.id} as timed out:`, error);
    }
  }

  if (timedOutGenerations.length > 0) {
    console.log(`Marked ${timedOutGenerations.length} old pending videos as failed (TIMEOUT)`);
  }

  // Auto-refund all failed generations that are refundable
  try {
    await autoRefundFailedGenerations();
  } catch (error) {
    console.error('Failed to auto-refund failed generations:', error);
  }
}

//#endregion

//#region Helper Functions

// ===== NEW HELPER FUNCTIONS FOR TAB-BASED ARCHITECTURE =====

async function triggerPythonBackendPersonGeneration({
  userId,
  generationId,
  mode,
  personFields,
  personPrompt,
}: {
  userId: string;
  generationId: string;
  mode: 'EASY' | 'ADVANCED';
  personFields?: {
    gender: string;
    age: string;
    ethnicity: string;
    clothing: string;
    expression: string;
    background: string;
  };
  personPrompt?: string;
}): Promise<void> {
  const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
  const pythonApiKey = process.env.PYTHON_API_KEY || 'dev-secret-key-change-in-production';

  try {
    const requestBody: any = {
      generation_id: generationId,
      user_id: userId,
      stage1_mode: mode,
    };

    if (mode === 'EASY' && personFields) {
      requestBody.person_fields = personFields;
    } else if (mode === 'ADVANCED' && personPrompt) {
      requestBody.person_prompt = personPrompt;
    }

    console.log('🚀 Triggering Python backend for person generation:', generationId);

    const response = await fetch(`${pythonBackendUrl}/api/v1/generate/person`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pythonApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Python backend failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();
    console.log(`✅ Successfully triggered Python backend for person generation: ${generationId}`);

    // Update database with the result
    if (result.success) {
      await prisma.videoGeneration.update({
        where: { id: generationId },
        data: {
          status: 'COMPLETED',
          generatedPersonUrl: result.person_url,
          s3KeyPerson: result.person_s3_key,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Database updated with person generation result: ${generationId}`);
    }

  } catch (error) {
    console.error('❌ Error triggering Python backend for person:', error);

    // Categorize error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let errorType = ErrorType.SERVICE_ERROR; // Default to service error (refundable)

    // Check if it's a validation/user error (non-refundable)
    if (errorMessage.includes('validation') || errorMessage.includes('invalid input')) {
      errorType = ErrorType.VALIDATION_ERROR;
    }

    // Mark generation as failed with proper error handling
    await markGenerationAsFailed({
      generationId,
      errorType,
      errorMessage: `Person generation failed: ${errorMessage}`,
    });

    throw new HttpError(500, 'Failed to start person generation. Please try again.');
  }
}

async function triggerPythonBackendCompositeGeneration({
  userId,
  generationId,
  personImageUrl,
  productImageUrl,
  compositePrompt,
}: {
  userId: string;
  generationId: string;
  personImageUrl: string;
  productImageUrl: string;
  compositePrompt?: string;
}): Promise<void> {
  const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
  const pythonApiKey = process.env.PYTHON_API_KEY || 'dev-secret-key-change-in-production';

  try {
    const requestBody: any = {
      generation_id: generationId,
      user_id: userId,
      person_image_url: personImageUrl,
      product_image_url: productImageUrl,
    };

    if (compositePrompt) {
      requestBody.composite_prompt = compositePrompt;
    }

    console.log('🚀 Triggering Python backend for composite generation:', generationId);

    const response = await fetch(`${pythonBackendUrl}/api/v1/generate/composite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pythonApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Python backend failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();
    console.log(`✅ Successfully triggered Python backend for composite generation: ${generationId}`);

    // Update database with the result
    if (result.success) {
      await prisma.videoGeneration.update({
        where: { id: generationId },
        data: {
          status: 'COMPLETED',
          compositeImageUrl: result.composite_url,
          s3KeyComposite: result.composite_s3_key,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Database updated with composite generation result: ${generationId}`);
    }

  } catch (error) {
    console.error('❌ Error triggering Python backend for composite:', error);

    // Categorize error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let errorType = ErrorType.SERVICE_ERROR; // Default to service error (refundable)

    // Check if it's a validation/user error (non-refundable)
    if (errorMessage.includes('validation') || errorMessage.includes('invalid input')) {
      errorType = ErrorType.VALIDATION_ERROR;
    }

    // Mark generation as failed with proper error handling
    await markGenerationAsFailed({
      generationId,
      errorType,
      errorMessage: `Composite generation failed: ${errorMessage}`,
    });

    throw new HttpError(500, 'Failed to start composite generation. Please try again.');
  }
}

async function triggerPythonBackendVideoGeneration({
  userId,
  generationId,
  compositeImageUrl,
  videoPrompt,
  veo3Mode,
  duration,
  aspectRatio,
  productImageUrl,
}: {
  userId: string;
  generationId: string;
  compositeImageUrl: string;
  videoPrompt: string;
  veo3Mode: 'FAST' | 'STANDARD';
  duration: number;
  aspectRatio: string;
  productImageUrl?: string;  // NEW: For GPT-4o enhancement
}): Promise<void> {
  const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
  const pythonApiKey = process.env.PYTHON_API_KEY || 'dev-secret-key-change-in-production';

  try {
    const requestBody: any = {
      generation_id: generationId,
      user_id: userId,
      composite_image_url: compositeImageUrl,
      video_prompt: videoPrompt,
      veo3_mode: veo3Mode,
      duration,
      aspect_ratio: aspectRatio,
    };

    // Add product image URL if provided (for GPT-4o enhancement)
    if (productImageUrl) {
      requestBody.product_image_url = productImageUrl;
    }

    console.log('🚀 Triggering Python backend for video generation:', generationId);
    console.log('🎥 Veo3 Mode:', veo3Mode);

    const response = await fetch(`${pythonBackendUrl}/api/v1/generate/video-only`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pythonApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Python backend failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();
    console.log(`✅ Successfully triggered Python backend for video generation: ${generationId}`);

    // Update database with the result
    if (result.success) {
      await prisma.videoGeneration.update({
        where: { id: generationId },
        data: {
          status: 'COMPLETED',
          finalVideoUrl: result.video_url,
          s3KeyVideo: result.video_s3_key,
          videoProvider: result.provider_used,
          fallbackUsed: result.fallback_triggered,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Database updated with video generation result: ${generationId}`);
    }

  } catch (error) {
    console.error('❌ Error triggering Python backend for video:', error);

    // Categorize error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let errorType = ErrorType.SERVICE_ERROR; // Default to service error (refundable)

    // Check if it's a validation/user error (non-refundable)
    if (errorMessage.includes('validation') || errorMessage.includes('invalid input')) {
      errorType = ErrorType.VALIDATION_ERROR;
    }

    // Mark generation as failed with proper error handling
    await markGenerationAsFailed({
      generationId,
      errorType,
      errorMessage: `Video generation failed: ${errorMessage}`,
    });

    throw new HttpError(500, 'Failed to start video generation. Please try again.');
  }
}

// ===== ORIGINAL FULL PIPELINE HELPER (legacy) =====

async function triggerPythonBackend({
  userId,
  videoGenerationId,
  mode,
  personFields,
  personPrompt,
  productImageUrl,
  compositePrompt,
  videoPrompt,
  veo3Mode,
  duration,
  aspectRatio,
}: {
  userId: string;
  videoGenerationId: string;
  mode: 'EASY' | 'ADVANCED';
  personFields?: {
    gender: string;
    age: string;
    ethnicity: string;
    clothing: string;
    expression: string;
    background: string;
  };
  personPrompt?: string;
  productImageUrl: string;
  compositePrompt?: string;
  videoPrompt: string;
  veo3Mode: 'FAST' | 'STANDARD';
  duration: number;
  aspectRatio: string;
}): Promise<void> {
  const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
  const pythonApiKey = process.env.PYTHON_API_KEY || 'dev-secret-key-change-in-production';

  try {
    const requestBody: any = {
      generation_id: videoGenerationId,
      user_id: userId,
      stage1_mode: mode,
      product_image_url: productImageUrl,
      video_prompt: videoPrompt,
      veo3_mode: veo3Mode,
      duration,
      aspect_ratio: aspectRatio,
    };

    // Add person_fields for EASY mode or person_prompt for ADVANCED mode
    if (mode === 'EASY' && personFields) {
      requestBody.person_fields = personFields;
    } else if (mode === 'ADVANCED' && personPrompt) {
      requestBody.person_prompt = personPrompt;
    }

    // Add optional composite_prompt
    if (compositePrompt) {
      requestBody.composite_prompt = compositePrompt;
    }

    console.log('🚀 Triggering Python backend for video generation:', videoGenerationId);
    console.log('📝 Mode:', mode);
    console.log('🎥 Veo3 Mode:', veo3Mode);

    const response = await fetch(`${pythonBackendUrl}/api/v1/generate/ugc-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pythonApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Python backend failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();
    console.log(`✅ Successfully triggered Python backend for video generation: ${videoGenerationId}`);
    console.log('📊 Result:', result);

    // Update database with the results from Python backend
    if (result.success) {
      await prisma.videoGeneration.update({
        where: { id: videoGenerationId },
        data: {
          status: 'COMPLETED',
          currentStage: 3,
          progress: 100,
          generatedPersonUrl: result.person_url,
          s3KeyPerson: result.person_s3_key,
          compositeImageUrl: result.composite_url,
          s3KeyComposite: result.composite_s3_key,
          finalVideoUrl: result.video_url,
          s3KeyVideo: result.video_s3_key,
          videoProvider: result.provider_used,
          fallbackUsed: result.fallback_triggered,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Database updated with video generation results: ${videoGenerationId}`);
    }

  } catch (error) {
    console.error('❌ Error triggering Python backend:', error);

    // Categorize error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let errorType = ErrorType.SERVICE_ERROR; // Default to service error (refundable)

    // Check if it's a validation/user error (non-refundable)
    if (errorMessage.includes('validation') || errorMessage.includes('invalid input')) {
      errorType = ErrorType.VALIDATION_ERROR;
    }

    // Mark generation as failed with proper error handling
    await markGenerationAsFailed({
      generationId: videoGenerationId,
      errorType,
      errorMessage: `Full pipeline generation failed: ${errorMessage}`,
    });

    throw new HttpError(500, 'Failed to start video generation workflow. Please try again.');
  }
}

//#endregion