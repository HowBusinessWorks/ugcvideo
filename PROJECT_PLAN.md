# UGC Video SaaS Development Project

## **Project Overview**
Building a credit-based SaaS platform where users can generate 8-second UGC-style videos using an n8n workflow that integrates AI services (Kie.ai Veo3, Fal.ai) with a Wasp frontend.

## **End Goal**
- Users purchase video generation credits through payment plans
- Users upload reference images and provide text prompts through Wasp frontend
- n8n workflow generates professional UGC videos in the background
- Videos are stored in S3 and accessible through user's video library
- No more Google Drive - everything managed within the SaaS platform

## **Technology Stack**
- **Frontend/Backend:** Wasp framework (React + Node.js)
- **Database:** PostgreSQL with Prisma
- **Video Generation:** n8n workflow with Kie.ai Veo3 + Fal.ai
- **Storage:** AWS S3 for videos and images
- **Payments:** Stripe (existing Wasp integration)

## **Current n8n Workflow Analysis**
- **Input:** Reference image (Google Drive link) + text prompt
- **Process:** Image analysis → Image generation (Fal.ai) → Video generation (Kie.ai)
- **Output:** 8-second video uploaded to Google Drive
- **Duration:** Fixed 8 seconds, portrait (9:16) aspect ratio

## **5-Day Development Schedule**

### **Day 1: Database & Payment Foundation** ✅
**Status:** Morning Tasks Completed
**Goal:** Set up core data structures and payment system

**Morning Tasks:**
- [x] Update `schema.prisma` with VideoGeneration model
- [x] Add VideoStatus enum (PENDING, PROCESSING, COMPLETED, FAILED)  
- [x] Add `videoCredits` field to User model
- [x] Run database migration (`wasp db migrate-dev`)

**Afternoon Tasks:**
- [x] Update payment plans in `src/payment/plans.ts` for video credits:
  - VideoStarter: 10 credits
  - VideoCreator: 50 credits  
  - VideoPro: 200 credits
  - VideoUnlimited: Subscription
- [x] Modify payment webhook to handle video credit purchases
- [x] Test payment flow with new credit-based plans

**Deliverable:** Database ready, credit-based payment system working ✅

---

### **Day 2: Backend Operations & API** ✅
**Status:** Morning Tasks Completed
**Goal:** Create all server-side video generation logic

**Morning Tasks:**
- [x] Create `src/video/operations.ts` with video operations
- [x] Implement `createVideoGeneration` with credit deduction logic
- [x] Implement `getUserVideos` and `getVideoById` queries

**Afternoon Tasks:**
- [x] Create `src/video/webhook.ts` for n8n status updates
- [x] Add all video operations to `main.wasp` configuration
- [x] Test operations with Wasp dev tools

**Deliverable:** All backend video operations working ✅

---

### **Day 3: Frontend Video Interface** ✅
**Status:** Complete
**Goal:** Build user-facing video generation and library

**Morning Tasks:**
- [x] Create `src/video/VideoGeneratorPage.tsx` - main interface
- [x] Build reference image upload component 
- [x] Create prompt input form with credit balance display

**Afternoon Tasks:**
- [x] Integrated video library within same page (bottom section)
- [x] Build video player component with controls
- [x] Add progress tracking for ongoing generations
- [x] Add route and navigation integration

**Deliverable:** Frontend video interfaces complete ✅

---

### **Day 4: n8n Integration & Workflow** ✅
**Status:** Complete
**Goal:** Modify n8n workflow and establish communication

**Morning Tasks:**
- [x] Replace manual trigger with webhook trigger in n8n
- [x] Update Brief1 node to use webhook data (not hardcoded)
- [x] Add status update HTTP request nodes to notify Wasp

**Afternoon Tasks:**
- [x] Replace Google Drive upload with S3 upload in n8n
- [x] Configure webhook authentication with shared secrets (using X-Webhook-Secret header)
- [x] Set up S3 bucket and IAM permissions for n8n
- [x] Debug and resolve Wasp authentication middleware conflicts

**Deliverable:** n8n workflow fully integrated with Wasp ✅

**Technical Notes:**
- Wasp automatically applies authentication to requests with `Authorization` headers
- Solution: Use custom `X-Webhook-Secret` header instead
- S3 upload requires `s3:GetBucketLocation` permission for IAM user
- Webhook endpoint: `/video-webhook` with proper payload validation

---

### **Day 5: Testing, Polish & Deployment** ⏳
**Status:** Not Started
**Goal:** Complete testing and production deployment

**Morning Tasks:**
- [ ] End-to-end integration testing (Frontend → Wasp → n8n → S3)
- [ ] Test credit deduction and payment flows
- [ ] Test all error scenarios and edge cases

**Afternoon Tasks:**
- [ ] Update navigation to include video generation
- [ ] Update pricing pages with video credit plans
- [ ] Production deployment setup
- [ ] Final production testing

**Deliverable:** Fully working UGC Video SaaS ready for users

## **Database Schema Design**

```prisma
model VideoGeneration {
  id                    String   @id @default(uuid())
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  user                 User     @relation(fields: [userId], references: [id])
  userId               String
  
  // Input from user
  referenceImageUrl    String   // S3 URL of uploaded reference image
  content              String   // User's description/prompt
  
  // Generated content URLs
  generatedImageUrl    String?  // Fal.ai generated image
  finalVideoUrl        String?  // Final video S3 URL
  thumbnailUrl         String?  // Video thumbnail
  
  // Status tracking
  status               VideoStatus @default(PENDING)
  progress             Int      @default(0)    // 0-100
  
  // Fixed for this workflow
  duration             Int      @default(8)    // Always 8 seconds
  aspectRatio          String   @default("9:16") // Portrait
  
  // Metadata
  fileSize             Int?     // bytes
  s3Key                String?  // S3 storage key
  n8nExecutionId       String?  // n8n workflow execution ID
  
  @@index([userId, createdAt])
}

enum VideoStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// Add to User model:
videoGenerations     VideoGeneration[]
videoCredits         Int @default(3)
```

## **Required n8n Workflow Changes**

1. **Replace Manual Trigger** → **Webhook Trigger**
   - Accept: `{userId, videoGenerationId, referenceImageUrl, content, webhookSecret}`

2. **Replace Brief1 hardcoded values** → **Use webhook data**
   - `gdrive link reference image`: `{{ $json.referenceImageUrl }}`
   - `content`: `{{ $json.content }}`

3. **Add Status Update Nodes:**
   - Start: POST to Wasp `/video-webhook` with `status: "PROCESSING"`
   - Progress: Update progress at key points (33%, 66%)  
   - Complete: POST with `status: "COMPLETED"` + video URLs
   - Error: POST with `status: "FAILED"` + error message

4. **Replace Google Drive Upload** → **S3 Upload**
   - Upload final video to user's S3 bucket
   - Generate presigned URLs for access

## **Environment Variables Needed**

```env
# n8n Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ugc-video
N8N_WEBHOOK_SECRET=your-shared-secret

# Video Credit Plans (Stripe)
PAYMENTS_VIDEO_STARTER_PLAN_ID=price_xxx
PAYMENTS_VIDEO_CREATOR_PLAN_ID=price_xxx  
PAYMENTS_VIDEO_PRO_PLAN_ID=price_xxx
PAYMENTS_VIDEO_UNLIMITED_PLAN_ID=price_xxx
```

## **Progress Tracking**

**Overall Progress:** 95% (4/5 days completed + Major UI/UX enhancements)

**Current Day:** Day 4 Complete ✅ + UI/UX & Image Upload Complete ✅
**Next Task:** Day 5 - Final testing & deployment

## **Recent Major Improvements** 🚀
**Status:** Complete ✅
**Goal:** Modern UI/UX with enhanced functionality

### **Landing Page Overhaul:**
- [x] **Hero Section Update** - Auto-playing UGC videos with new messaging
- [x] **VideoShowcase Enhancement** - Compact 3-column layout with real UGC examples
- [x] **Features Redesign** - Clean grid layout that fits on one screen
- [x] **Content Updates** - Replaced OpenSaaS template with UGC-specific content
- [x] **Color Consistency** - Removed all red/rose colors, implemented purple accent theme
- [x] **Testimonials** - Added authentic UGC customer testimonials
- [x] **FAQ Update** - Video generation specific questions and answers
- [x] **Navigation Cleanup** - Removed unused "Features" link
- [x] **CTA Removal** - Cleaned up unnecessary call-to-action sections

### **Image Upload System (NEW):** 
- [x] **File Upload Component** - Drag & drop image upload with preview
- [x] **S3 Integration** - Direct upload to S3 with public-read ACL
- [x] **Backend Operation** - New `uploadImageForVideo` action
- [x] **URL Generation** - Automatic public S3 URL construction
- [x] **Form Integration** - Replaced URL input with file upload in video generator
- [x] **Validation** - JPEG/PNG file type and size validation
- [x] **Error Handling** - Comprehensive error messages and debugging

### **Video Modal Enhancement:**
- [x] **Three-Column Layout** - Reference image, video, and details
- [x] **Complete Information** - Shows full prompt and creation details
- [x] **Download Feature** - Direct video download capability
- [x] **Responsive Design** - Works on all screen sizes
- [x] **Professional Styling** - Modern modal with proper spacing

## **Notes & Updates**
- Created initial project plan
- Analyzed existing n8n UGC creator workflow  
- Designed database schema for video generation tracking
- Planned 5-day development timeline
- **Day 1 Complete**: Database schema, payment system, and TypeScript fixes
- **Day 2 Complete**: Backend operations and video webhook API
- **Day 3 Complete**: Frontend video generation interface with real-time polling
- **Day 4 Complete**: n8n integration, S3 storage, webhook authentication
- **Major UI Overhaul**: Complete landing page redesign with UGC-specific content
- **Image Upload System**: Direct file upload replacing URL inputs
- **Enhanced User Experience**: Improved modals, navigation, and visual consistency

## **Key Achievements This Session:**
1. **Seamless Image Upload**: Users can now drag & drop images instead of providing URLs
2. **Public S3 Storage**: Images automatically uploaded with public-read permissions for n8n compatibility
3. **Professional Landing Page**: Complete OpenSaaS template replacement with video-specific content
4. **Enhanced Video Library**: Detailed modals showing reference images, prompts, and download options
5. **Design Consistency**: Purple accent theme throughout with improved spacing and typography

---

**Last Updated:** 2025-09-05 (Major UI/UX & Image Upload System Complete)
**Status:** Day 4 Complete + UI improvements in progress