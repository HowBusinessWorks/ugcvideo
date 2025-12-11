import { prisma } from 'wasp/server';
import type { VideoGeneration } from 'wasp/entities';
import { CREDIT_COSTS } from '../payment/plans';

// Error type categorization
export enum ErrorType {
  USER_ERROR = 'USER_ERROR',           // Invalid input from user (no refund)
  SYSTEM_ERROR = 'SYSTEM_ERROR',       // Backend crash, database error (refund)
  SERVICE_ERROR = 'SERVICE_ERROR',     // AI service error, S3 error (refund)
  TIMEOUT = 'TIMEOUT',                 // Generation timeout (refund)
  VALIDATION_ERROR = 'VALIDATION_ERROR' // Input validation failed (no refund)
}

// User-friendly error messages
export const ErrorMessages = {
  [ErrorType.USER_ERROR]: 'Invalid input provided. Please check your data and try again.',
  [ErrorType.SYSTEM_ERROR]: 'A system error occurred. Your credits will be refunded automatically.',
  [ErrorType.SERVICE_ERROR]: 'The AI service is temporarily unavailable. Your credits will be refunded.',
  [ErrorType.TIMEOUT]: 'Generation took too long and timed out. Your credits will be refunded.',
  [ErrorType.VALIDATION_ERROR]: 'Please fix the validation errors and try again.',
};

// Determine if error type should be refunded
export function isRefundableError(errorType: ErrorType): boolean {
  return [
    ErrorType.SYSTEM_ERROR,
    ErrorType.SERVICE_ERROR,
    ErrorType.TIMEOUT
  ].includes(errorType);
}

// Calculate credits to refund based on asset type
export function getCreditsToRefund(generation: VideoGeneration): number {
  switch (generation.assetType) {
    case 'PERSON':
      return CREDIT_COSTS.PERSON;
    case 'COMPOSITE':
      return CREDIT_COSTS.COMPOSITE;
    case 'VIDEO':
      // Check which video mode was used
      if (generation.veo3Mode === 'FAST') {
        return CREDIT_COSTS.VIDEO_FAST;
      } else {
        return CREDIT_COSTS.VIDEO_STANDARD;
      }
    case 'FULL_PIPELINE':
      // For full pipeline, refund based on which stage failed
      if (generation.stage1Error) return CREDIT_COSTS.PERSON;
      if (generation.stage2Error) return CREDIT_COSTS.COMPOSITE;
      if (generation.stage3Error) {
        return generation.veo3Mode === 'FAST'
          ? CREDIT_COSTS.VIDEO_FAST
          : CREDIT_COSTS.VIDEO_STANDARD;
      }
      return 0;
    default:
      return 0;
  }
}

// Mark generation as failed with error details
export async function markGenerationAsFailed({
  generationId,
  errorType,
  errorMessage,
  stageError,
}: {
  generationId: string;
  errorType: ErrorType;
  errorMessage?: string;
  stageError?: { stage: 1 | 2 | 3; message: string };
}): Promise<void> {
  const isRefundable = isRefundableError(errorType);
  const userFriendlyMessage = errorMessage || ErrorMessages[errorType];

  await prisma.videoGeneration.update({
    where: { id: generationId },
    data: {
      status: 'FAILED',
      errorType,
      errorMessage: userFriendlyMessage,
      isRefundable,
      canRetry: true,
      ...(stageError && {
        [`stage${stageError.stage}Error`]: stageError.message
      })
    },
  });
}

// Process refund for failed generation
export async function processRefund(generationId: string): Promise<{ success: boolean; creditsRefunded: number }> {
  const generation = await prisma.videoGeneration.findUnique({
    where: { id: generationId },
    include: { user: true },
  });

  if (!generation) {
    throw new Error('Generation not found');
  }

  // Check if already refunded
  if (generation.creditsRefunded) {
    return { success: false, creditsRefunded: 0 };
  }

  // Check if refundable
  if (!generation.isRefundable) {
    return { success: false, creditsRefunded: 0 };
  }

  // Calculate refund amount
  const creditsToRefund = getCreditsToRefund(generation);

  if (creditsToRefund === 0) {
    return { success: false, creditsRefunded: 0 };
  }

  // Process refund transaction
  await prisma.$transaction([
    // Refund credits to user
    prisma.user.update({
      where: { id: generation.userId },
      data: {
        videoCredits: { increment: creditsToRefund }
      }
    }),
    // Mark as refunded
    prisma.videoGeneration.update({
      where: { id: generationId },
      data: { creditsRefunded: true }
    })
  ]);

  console.log(`✅ Refunded ${creditsToRefund} credits for generation ${generationId}`);

  return { success: true, creditsRefunded: creditsToRefund };
}

// Auto-refund failed generations (called by cleanup job)
export async function autoRefundFailedGenerations(): Promise<void> {
  const failedGenerations = await prisma.videoGeneration.findMany({
    where: {
      status: 'FAILED',
      isRefundable: true,
      creditsRefunded: false,
    },
  });

  for (const generation of failedGenerations) {
    try {
      await processRefund(generation.id);
    } catch (error) {
      console.error(`Failed to refund generation ${generation.id}:`, error);
    }
  }
}
