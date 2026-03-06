# Gastronomic Cuisine

Premium mobile-first Next.js application for AI-assisted Michelin-like menu generation, invite approval workflows, shopping orchestration, cook timelines, and favorites curation.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS
- shadcn/ui-style primitives + Radix UI + Motion
- Supabase (auth/data/storage) with RLS
- OpenAI server-side integrations
- Twilio SMS for approvals and feedback loops

## Quick start
1. Copy environment values:
   ```bash
   cp .env.example .env.local
   ```
2. Fill all Supabase / OpenAI / Twilio keys.
3. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```
4. Apply database schema:
   - Run SQL from `supabase/schema.sql` in Supabase SQL editor.
5. Optional: configure Supabase storage bucket `menu-assets` for generated dish/menu imagery.

## Architecture highlights
- App routes for chef modules:
  - `/dashboard`, `/generate`, `/approval`, `/shopping/[menuId]`, `/cook/[menuId]`, `/favorites`, `/favorites/[menuId]`
- Public tokenized invite route:
  - `/approval/[token]`
- Secure API route handlers:
  - `/api/generate-menu`, `/api/share-menu`, `/api/send-approval-sms`, `/api/approval/[token]`, `/api/validate-menu`, `/api/generate-shopping-list`, `/api/generate-cook-plan`, `/api/feedback/send`, `/api/feedback/[token]`, `/api/cron/send-feedback`

## Security notes
- All sensitive operations happen server-side route handlers.
- Service-role key is only read in server-only utility (`src/lib/supabase/server.ts`).
- Browser uses anon key only (`src/lib/supabase/client.ts`).
- OpenAI and Twilio keys are never exposed client-side.

## Asset placeholders
This repository does **not** commit binary media assets by default.
If you want curated hero dish photos, upload manually to Supabase Storage bucket `menu-assets` and store object paths in your menu records.
