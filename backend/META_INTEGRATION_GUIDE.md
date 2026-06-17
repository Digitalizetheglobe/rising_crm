# Meta Ads Lead Integration Implementation Guide

## Overview
This document outlines the complete Meta Lead Ads integration added to the Rising CRM system.

## Files Created

### MetaWebhook Module (`src/modules/metaWebhook/`)

1. **metaWebhook.constants.ts**
   - Route definitions
   - Platform enums (facebook, instagram)
   - Status enums (pending, resolved)

2. **metaWebhook.model.ts**
   - `MetaWebhookEvent` - Stores all webhook events for audit/debugging
   - Tracks: leadgen_id, ad_id, form_id, page_id, platform, payload, status, enquiry mapping

3. **unmatchedMetaLeads.model.ts**
   - `UnmatchedMetaLead` - Stores leads with no matching project campaign
   - Allows admin to manually review and resolve unmatched leads later
   - Status: pending/resolved

4. **metaWebhook.validation.ts**
   - Joi schema for resolving unmatched leads

5. **metaWebhook.service.ts**
   - Core business logic:
     - `verifyMetaWebhookSignature()` - HMAC SHA256 validation
     - `fetchMetaLeadData()` - Calls Meta Graph API v19.0 to get full lead details
     - `processMetaLead()` - Main orchestration function with deduplication, project matching, enquiry creation
     - `getUnmatchedLeads()` - List unmatched leads for admin review
     - `resolveUnmatchedLead()` - Update unmatched lead status

6. **metaWebhook.controller.ts**
   - `verifyMetaWebhook()` - GET /api/v1/meta-leads (webhook verification)
   - `receiveMetaWebhook()` - POST /api/v1/meta-leads (webhook receiver)
   - `getUnmatchedMetaLeads()` - GET /api/v1/meta-leads/unmatched (admin only)
   - `markUnmatchedAsResolved()` - PATCH /api/v1/meta-leads/unmatched/:id (admin only)

7. **metaWebhook.routes.ts**
   - Public routes: GET/POST /meta-leads (no auth required)
   - Admin routes: GET/PATCH /meta-leads/unmatched (requires SUPER_ADMIN, ADMIN, or SALES_MANAGER)

### Updated Existing Models

1. **Project Model** (`src/modules/projects/project.model.ts`)
   - Added `metaCampaigns` field - array of embedded objects:
     ```typescript
     {
       adId: String,              // Unique across all projects
       formId: String,
       campaignLabel: String,     // e.g., "Skyline Tower – 2BHK – FB"
       platform: 'facebook' | 'instagram',
       defaultAssigneeId: ObjectId (ref: User, optional),
       isActive: Boolean,
       createdAt: Date
     }
     ```
   - Added indexes:
     - `metaCampaigns.adId` (unique, sparse)
     - `metaCampaigns.adId + metaCampaigns.isActive` (for fast lookups)

2. **Enquiry Model** (`src/modules/enquiries/enquiry.model.ts`)
   - Added source type: `'META_ADS'`
   - Added platform field: `'facebook' | 'instagram'`
   - Added Meta-specific fields:
     - `metaLeadId` (String, unique, sparse)
     - `metaAdId` (String)
     - `metaFormId` (String)
     - `rawMetaPayload` (Mixed - stores full Graph API response)

3. **Project Validation** (`src/modules/projects/project.validation.ts`)
   - Added metaCampaigns validation to both create and update schemas
   - Validates: adId, formId, campaignLabel, platform, defaultAssigneeId (optional)

4. **Enquiry Validation** (`src/modules/enquiries/enquiry.validation.ts`)
   - Added 'META_ADS' to source enum in both create and update schemas
   - Added optional platform field validation

### Route Registration

Updated `src/routes/index.ts`:
- Registered `/meta-leads` routes at the top (before other routes)
- Ensures public webhook endpoints are accessible without auth

## API Endpoints

### Public Endpoints (No Auth Required)

#### 1. Webhook Verification (GET)
```
GET /api/v1/meta-leads
Query params:
  - hub.mode: 'subscribe'
  - hub.verify_token: Your META_VERIFY_TOKEN
  - hub.challenge: Meta's challenge string

Response:
  - On success: Returns the hub.challenge value (200)
  - On failure: { success: false, message: "..." } (403)
```

#### 2. Webhook Receiver (POST)
```
POST /api/v1/meta-leads
Headers:
  - X-Hub-Signature-256: HMAC SHA256 signature

Body:
{
  "entry": [{
    "changes": [{
      "value": {
        "leadgen_id": "...",
        "ad_id": "...",
        "form_id": "...",
        "page_id": "...",
        "field_data": [
          { "name": "full_name", "values": ["John Doe"] },
          { "name": "phone_number", "values": ["9876543210"] },
          { "name": "email", "values": ["john@example.com"] }
        ]
      }
    }]
  }]
}

Response:
  - Immediately returns 200 { success: true }
  - Processes asynchronously in background
```

### Protected Endpoints (Admin/Manager Only)

#### 3. List Unmatched Leads (GET)
```
GET /api/v1/meta-leads/unmatched
Auth: Bearer <token>
Required Role: SUPER_ADMIN, ADMIN, or SALES_MANAGER

Query params:
  - page: number (default: 1)
  - limit: number (default: 10)
  - status: 'pending' | 'resolved' (optional)

Response:
{
  "success": true,
  "data": {
    "leads": [...],
    "total": number,
    "page": number,
    "totalPages": number,
    "hasNextPage": boolean,
    "hasPrevPage": boolean
  }
}
```

#### 4. Resolve Unmatched Lead (PATCH)
```
PATCH /api/v1/meta-leads/unmatched/:id
Auth: Bearer <token>
Required Role: SUPER_ADMIN, ADMIN, or SALES_MANAGER

Body:
{
  "status": "resolved" | "pending" (optional),
  "notes": "Admin notes..." (optional)
}

Response:
{
  "success": true,
  "message": "Unmatched lead updated successfully",
  "data": { ...updatedLead }
}
```

## Environment Variables

Add these to your `.env` file:

```env
# Meta Webhook Configuration
META_VERIFY_TOKEN=your_random_secret_token_here
META_PAGE_ACCESS_TOKEN=your_meta_page_access_token
META_APP_SECRET=your_meta_app_secret

# Example:
# META_VERIFY_TOKEN=abc123xyz789
# META_PAGE_ACCESS_TOKEN=EAABsbCS1iHgBAOZA...
# META_APP_SECRET=1234567890abcdef
```

## Webhook Processing Flow

### Step 1: Webhook Verification (Meta Setup)
```
Meta sends GET request → verifyMetaWebhook()
→ Checks hub.verify_token against META_VERIFY_TOKEN
→ Returns hub.challenge if valid
```

### Step 2: Lead Webhook Reception
```
Meta sends POST with lead data → receiveMetaWebhook()
→ Validates X-Hub-Signature-256 header using META_APP_SECRET
→ Returns 200 immediately (synchronous)
→ Spawns background processMetaLead() call
```

### Step 3: Lead Processing (Background/Async)
```
processMetaLead():
  1. Deduplication: Check if metaLeadId exists in Enquiry collection
  2. Fetch Full Lead Data: Call Meta Graph API v19.0 to get field_data
  3. Parse Fields: Extract full_name, phone_number, email from field_data array
  4. Project Matching: Query Project collection for matching adId + isActive campaign
  5. Handle Unmatched:
     - If no campaign found → Save to UnmatchedMetaLead collection
     - Log to MetaWebhookEvent with status: 'unmatched'
     - Return (no enquiry created)
  6. Create Enquiry:
     - source: 'META_ADS'
     - platform: from campaign (facebook/instagram)
     - name: from parsed full_name
     - phone: from parsed phone_number (required)
     - email: from parsed email (if present)
     - interestedProject: matched project._id
     - assignedTo: campaign.defaultAssigneeId (if set, else null)
     - metaLeadId: leadgen_id (for deduplication)
     - metaAdId: ad_id
     - metaFormId: form_id
     - rawMetaPayload: full Graph API response
     - status: 'Pending'
  7. Log Success: Store MetaWebhookEvent with status: 'success', enquiryId reference
  8. Notify Assignee: If defaultAssigneeId set, create notification with Enquiry reference
```

## Data Models

### MetaWebhookEvent Schema
```typescript
{
  eventId: String,              // Unique: {leadgen_id}-{timestamp}
  leadgenId: String,            // Indexed
  adId: String,                 // Indexed
  formId: String,
  pageId: String,
  platform: 'facebook' | 'instagram',
  rawPayload: Mixed,            // Full webhook payload
  processedAt: Date,
  status: 'success' | 'failed' | 'unmatched',
  enquiryId?: ObjectId,         // Reference if matched to enquiry
  errorMessage?: String,        // If status is 'failed'
  createdAt: Date,
  updatedAt: Date
}
```

### UnmatchedMetaLead Schema
```typescript
{
  leadgenId: String,            // Unique
  adId: String,                 // Indexed (to group by campaign)
  formId: String,
  pageId: String,
  rawPayload: Mixed,            // Full webhook payload
  status: 'pending' | 'resolved',
  resolvedAt?: Date,
  notes?: String,               // Admin notes
  createdAt: Date,
  updatedAt: Date
}
```

### Project.metaCampaigns Schema
```typescript
{
  adId: String,                 // Unique across all projects
  formId: String,
  campaignLabel: String,
  platform: 'facebook' | 'instagram',
  defaultAssigneeId?: ObjectId, // Ref: User
  isActive: Boolean,
  createdAt: Date
}
```

### Enquiry Meta Fields
```typescript
{
  metaLeadId: String,           // Unique, sparse index
  metaAdId: String,
  metaFormId: String,
  rawMetaPayload: Mixed,
  platform?: 'facebook' | 'instagram'
}
```

## Security Considerations

1. **Signature Verification**: All incoming webhooks are verified using HMAC SHA256 with META_APP_SECRET
2. **Deduplication**: Prevents duplicate enquiries if Meta sends same lead twice
3. **Async Processing**: Webhook endpoint returns 200 immediately (Meta timeout: ~30s)
4. **Role-Based Access**: Unmatched lead admin endpoints require SUPER_ADMIN, ADMIN, or SALES_MANAGER
5. **Phone Validation**: Leads without phone numbers are skipped (required field in Enquiry)

## Admin Workflow for Unmatched Leads

1. Admin periodically checks `/meta-leads/unmatched?status=pending`
2. Reviews campaigns with no matching project ads
3. Either:
   a. Creates matching campaign in Project + manually updates lead via Enquiry API
   b. Marks lead as `resolved` with notes explaining why it was unmatched
   c. Updates campaign adId in Project and manually creates enquiry

## Integration Testing

### Test Webhook Verification
```bash
curl -X GET "http://localhost:3000/api/v1/meta-leads?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test_challenge"
```

### Test Webhook Receiver
```bash
curl -X POST "http://localhost:3000/api/v1/meta-leads" \
  -H "X-Hub-Signature-256: sha256=your_signature" \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "leadgen_id": "123456",
          "ad_id": "facebook_ad_123",
          "form_id": "form_456",
          "page_id": "789",
          "field_data": [
            {"name": "full_name", "values": ["Test User"]},
            {"name": "phone_number", "values": ["9876543210"]}
          ]
        }
      }]
    }]
  }'
```

### Test Unmatched Leads
```bash
# Get unmatched leads
curl -X GET "http://localhost:3000/api/v1/meta-leads/unmatched?page=1&limit=10" \
  -H "Authorization: Bearer your_token"

# Resolve an unmatched lead
curl -X PATCH "http://localhost:3000/api/v1/meta-leads/unmatched/lead_id" \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved", "notes": "Campaign found but no matching project"}'
```

## Meta Facebook Setup Steps

1. Create a Facebook App at https://developers.facebook.com/apps
2. Get your APP_ID and APP_SECRET
3. Generate a Page Access Token with `leads_retrieval` permission
4. Set Webhook URL to: `https://your-domain.com/api/v1/meta-leads`
5. Use your META_VERIFY_TOKEN as the verification token
6. Subscribe to: `leadgen` webhook events
7. Store all three values in your `.env`

## Notes

- Lead field parsing is case-insensitive and handles common field name variations
- Platform is currently hardcoded to 'facebook' but can be inferred from ad_id patterns if needed
- Notifications are created only if defaultAssigneeId is set on the campaign
- MetaWebhookEvent provides audit trail of all webhook activity
- Unmatched leads remain pending until admin reviews and resolves them
- No modifications to existing modules' controllers or services
