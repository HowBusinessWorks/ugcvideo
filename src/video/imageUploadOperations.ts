import * as z from 'zod';
import { HttpError } from 'wasp/server';
import type { UploadImageForVideo } from 'wasp/server/operations';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { randomUUID } from 'crypto';
import * as path from 'path';

const uploadImageForVideoInputSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.enum(['image/jpeg', 'image/png'], {
    errorMap: () => ({ message: 'Only JPEG and PNG images are allowed' }),
  }),
});

type UploadImageForVideoInput = z.infer<typeof uploadImageForVideoInputSchema>;

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
  },
});

function getS3KeyForImage(fileName: string, userId: string) {
  const ext = path.extname(fileName).slice(1);
  return `images/${userId}/${randomUUID()}.${ext}`;
}

export const uploadImageForVideo: UploadImageForVideo<
  UploadImageForVideoInput,
  {
    s3UploadUrl: string;
    s3UploadFields: Record<string, string>;
    publicImageUrl: string;
    key: string;
  }
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be authenticated to upload images');
  }

  const { fileType, fileName } = ensureArgsSchemaOrThrowHttpError(uploadImageForVideoInputSchema, rawArgs);

  const bucketName = process.env.AWS_S3_FILES_BUCKET || 'ugc-video-saas-138759786970';
  const region = process.env.AWS_S3_REGION || 'eu-north-1';
  const key = getS3KeyForImage(fileName, context.user.id);

  try {
    // Create presigned post with public-read ACL so the image is accessible to external services
    const { url: s3UploadUrl, fields: s3UploadFields } = await createPresignedPost(s3Client, {
      Bucket: bucketName,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 5 * 1024 * 1024], // 5MB limit
      ],
      Fields: {
        'Content-Type': fileType,
        'acl': 'public-read', // Make the uploaded file publicly readable
      },
      Expires: 3600,
    });

    const publicImageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    return {
      s3UploadUrl,
      s3UploadFields,
      publicImageUrl,
      key,
    };
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    throw new HttpError(500, 'Failed to create upload URL');
  }
};