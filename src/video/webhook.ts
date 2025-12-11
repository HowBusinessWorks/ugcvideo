import { type MiddlewareConfigFn, HttpError } from 'wasp/server';
import { type VideoStatusWebhook } from 'wasp/server/api';
import { prisma } from 'wasp/server';
import * as z from 'zod';

// Webhook payload schema for Python backend 3-stage pipeline updates
const videoWebhookPayloadSchema = z.object({
  generation_id: z.string().uuid('Invalid video generation ID'),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  current_stage: z.number().min(1).max(3).optional(),
  progress: z.number().min(0).max(100).optional(),

  // Stage 1: Person generation
  generated_person_url: z.string().url().optional(),
  stage1_error: z.string().optional(),

  // Stage 2: Product compositing
  composite_image_url: z.string().url().optional(),
  stage2_error: z.string().optional(),

  // Stage 3: Video generation
  final_video_url: z.string().url().optional(),
  video_thumbnail_url: z.string().url().optional(),
  video_provider: z.string().optional(), // "kie" or "fal"
  fallback_used: z.boolean().optional(),
  stage3_error: z.string().optional(),

  // S3 keys for tracking
  s3_key_person: z.string().optional(),
  s3_key_composite: z.string().optional(),
  s3_key_video: z.string().optional(),

  // Error handling fields (NEW)
  error_type: z.enum(['USER_ERROR', 'SYSTEM_ERROR', 'SERVICE_ERROR', 'TIMEOUT', 'VALIDATION_ERROR']).optional(),
  error_message: z.string().optional(),
  is_refundable: z.boolean().optional(),
  can_retry: z.boolean().optional(),

  // Legacy fields (for backwards compatibility)
  generatedImageUrl: z.string().url().optional(),
  finalVideoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  s3Key: z.string().optional(),
  n8nExecutionId: z.string().optional(),
});

export const videoStatusWebhook: VideoStatusWebhook = async (request, response, context) => {
  console.log('🎯 VIDEO WEBHOOK HIT!', new Date().toISOString());
  console.log('📦 Payload:', JSON.stringify(request.body, null, 2));

  try {
    // Verify webhook secret using custom header or Authorization bearer
    const webhookSecret = request.headers['x-webhook-secret'] || request.headers['authorization']?.replace('Bearer ', '');
    const expectedSecret = process.env.PYTHON_API_KEY || process.env.N8N_WEBHOOK_SECRET;

    if (expectedSecret) {
      if (!webhookSecret || webhookSecret !== expectedSecret) {
        console.error('❌ Webhook auth failed');
        return response.status(401).json({ error: 'Invalid webhook secret' });
      }
    }

    // Parse and validate payload
    const payload = videoWebhookPayloadSchema.parse(request.body);
    const generationId = payload.generation_id;

    // Find the video generation record
    const videoGeneration = await prisma.videoGeneration.findUnique({
      where: { id: generationId },
    });

    if (!videoGeneration) {
      console.error(`❌ Video generation not found: ${generationId}`);
      return response.status(404).json({ error: 'Video generation not found' });
    }

    // Build update data
    const updateData: any = {
      status: payload.status,
      updatedAt: new Date(),
    };

    // 3-Stage Pipeline Progress
    if (payload.current_stage !== undefined) updateData.currentStage = payload.current_stage;
    if (payload.progress !== undefined) updateData.progress = payload.progress;

    // Stage 1: Person Generation
    if (payload.generated_person_url) updateData.generatedPersonUrl = payload.generated_person_url;
    if (payload.stage1_error) updateData.stage1Error = payload.stage1_error;
    if (payload.s3_key_person) updateData.s3KeyPerson = payload.s3_key_person;

    // Stage 2: Product Compositing
    if (payload.composite_image_url) updateData.compositeImageUrl = payload.composite_image_url;
    if (payload.stage2_error) updateData.stage2Error = payload.stage2_error;
    if (payload.s3_key_composite) updateData.s3KeyComposite = payload.s3_key_composite;

    // Stage 3: Video Generation
    if (payload.final_video_url) updateData.finalVideoUrl = payload.final_video_url;
    if (payload.video_thumbnail_url) updateData.videoThumbnailUrl = payload.video_thumbnail_url;
    if (payload.video_provider) updateData.videoProvider = payload.video_provider;
    if (payload.fallback_used !== undefined) updateData.fallbackUsed = payload.fallback_used;
    if (payload.stage3_error) updateData.stage3Error = payload.stage3_error;
    if (payload.s3_key_video) updateData.s3KeyVideo = payload.s3_key_video;

    // Error handling fields (NEW)
    if (payload.error_type) updateData.errorType = payload.error_type;
    if (payload.error_message) updateData.errorMessage = payload.error_message;
    if (payload.is_refundable !== undefined) updateData.isRefundable = payload.is_refundable;
    if (payload.can_retry !== undefined) updateData.canRetry = payload.can_retry;

    // Legacy fields (backwards compatibility)
    if (payload.generatedImageUrl) updateData.generatedImageUrl = payload.generatedImageUrl;
    if (payload.finalVideoUrl) updateData.finalVideoUrl = payload.finalVideoUrl;
    if (payload.thumbnailUrl) updateData.thumbnailUrl = payload.thumbnailUrl;
    if (payload.s3Key) updateData.s3Key = payload.s3Key;
    if (payload.n8nExecutionId) updateData.n8nExecutionId = payload.n8nExecutionId;

    // Update database
    await prisma.videoGeneration.update({
      where: { id: generationId },
      data: updateData,
    });

    console.log(`✅ Video generation ${generationId} updated:`, {
      status: payload.status,
      stage: payload.current_stage,
      progress: payload.progress,
    });

    return response.status(200).json({
      success: true,
      message: 'Video status updated successfully',
      generation_id: generationId,
      status: payload.status,
      current_stage: payload.current_stage,
    });

  } catch (error) {
    console.error('❌ Video webhook error:', error);

    if (error instanceof z.ZodError) {
      console.error('❌ Validation errors:', error.errors);
      return response.status(400).json({
        error: 'Invalid webhook payload',
        details: error.errors
      });
    }

    return response.status(500).json({ error: 'Internal server error processing video webhook' });
  }
};

export const videoWebhookMiddleware: MiddlewareConfigFn = (middlewareConfig) => {
  console.log('🔧 VIDEO WEBHOOK MIDDLEWARE CALLED');
  return middlewareConfig;
};