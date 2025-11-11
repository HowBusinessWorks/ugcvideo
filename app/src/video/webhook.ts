import { type MiddlewareConfigFn, HttpError } from 'wasp/server';
import { type VideoStatusWebhook } from 'wasp/server/api';
import { prisma } from 'wasp/server';
import * as z from 'zod';

// Webhook payload schema for n8n status updates
const videoWebhookPayloadSchema = z.object({
  videoGenerationId: z.string().uuid('Invalid video generation ID'),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  progress: z.number().min(0).max(100).optional(),
  generatedImageUrl: z.string().url().optional(),
  finalVideoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  fileSize: z.number().positive().optional(),
  s3Key: z.string().optional(),
  n8nExecutionId: z.string().optional(),
  errorMessage: z.string().optional(),
});

export const videoStatusWebhook: VideoStatusWebhook = async (request, response, context) => {
  console.log('🎯 VIDEO WEBHOOK HIT!', new Date().toISOString());
  
  try {
    // Verify webhook secret using custom header
    const webhookSecret = request.headers['x-webhook-secret'];
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
    
    if (expectedSecret) {
      if (!webhookSecret || webhookSecret !== expectedSecret) {
        return response.status(401).json({ error: 'Invalid webhook secret' });
      }
    }

    // Parse and validate payload
    const payload = videoWebhookPayloadSchema.parse(request.body);

    // Find the video generation record
    const videoGeneration = await prisma.videoGeneration.findUnique({
      where: { id: payload.videoGenerationId },
    });

    if (!videoGeneration) {
      return response.status(404).json({ error: 'Video generation not found' });
    }

    // Update the video generation record
    const updateData: any = {
      status: payload.status,
      updatedAt: new Date(),
    };

    // Add optional fields if provided
    if (payload.progress !== undefined) updateData.progress = payload.progress;
    if (payload.generatedImageUrl) updateData.generatedImageUrl = payload.generatedImageUrl;
    if (payload.finalVideoUrl) updateData.finalVideoUrl = payload.finalVideoUrl;
    if (payload.thumbnailUrl) updateData.thumbnailUrl = payload.thumbnailUrl;
    if (payload.s3Key) updateData.s3Key = payload.s3Key;
    if (payload.n8nExecutionId) updateData.n8nExecutionId = payload.n8nExecutionId;

    const updatedVideoGeneration = await prisma.videoGeneration.update({
      where: { id: payload.videoGenerationId },
      data: updateData,
    });

    console.log(`Video generation ${payload.videoGenerationId} updated to status: ${payload.status}`);

    return response.status(200).json({ 
      success: true, 
      message: 'Video status updated successfully',
      videoGenerationId: payload.videoGenerationId,
      status: payload.status,
    });

  } catch (error) {
    console.error('Video webhook error:', error);
    
    if (error instanceof z.ZodError) {
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