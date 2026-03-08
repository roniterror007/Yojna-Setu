# Yojna-Setu — Complete Implementation Status
**Team:** NON-NEGOTIATORS | **Hackathon:** AI for Bharat 2026 | **Problem:** PS03

---

## Project Overview

Yojna-Setu (योजना-सेतु) is a voice-first, multilingual AI assistant that helps every Indian citizen discover and apply for government welfare schemes. It works in Hindi, Kannada, Tamil, Telugu, and English.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion |
| AI / LLM | Amazon Bedrock — Amazon Nova Pro (`amazon.nova-pro-v1:0`) |
| Voice Input (STT) | Web Speech API (browser-native) + Amazon Transcribe (server-side) |
| Voice Output (TTS) | Amazon Polly (server-side) + Browser Speech Synthesis (fallback) |
| Session Storage | Amazon DynamoDB + in-memory fallback |
| Scheme Storage | Amazon S3 + local JSON fallback |
| Serverless Backend | AWS Lambda + API Gateway (via AWS Amplify — auto-managed) |
| Deployment | AWS Amplify (frontend + Lambda-backed API routes) |
| Scheduling | AWS EventBridge (48h scheme refresh cron) |
| Background Music | `/api/music` proxy route → archive.org (no large file in repo) |

---

## File Structure

```
yojna-setu/
├── app/
│   ├── page.js                      # Landing page (music, transitions, language cycle)
│   ├── chat/
│   │   └── page.js                  # Main chat UI (voice, TTS, messages, scheme cards)
│   └── api/
│       ├── chat/route.js            # AI scheme matching via Amazon Bedrock Nova Pro
│       ├── speak/route.js           # TTS — Polly + browser fallback
│       ├── transcribe/route.js      # STT — Amazon Transcribe
│       ├── session/route.js         # DynamoDB session persistence (GET/POST/DELETE)
│       ├── music/route.js           # Music proxy — streams from archive.org (bypasses CORS)
│       └── refresh-schemes/route.js # 48h scheme cache invalidation
├── components/
│   ├── SchemeCard.jsx               # Scheme card with lastUpdated badge
│   ├── VoiceButton.jsx              # Mic button with waveform + silence auto-stop
│   ├── SplashScreen.jsx             # 6-phase animated launch screen
│   ├── AshokaEmblem.jsx             # National emblem img component (unused — reverted to 🏛️)
│   ├── SamplePrompts.jsx            # Suggested prompts per language
│   ├── DynamicGlow.jsx              # Background glow animation
│   └── LoadingDots.jsx              # Typing indicator
├── lib/
│   ├── schemes.js                   # Local scheme data + AI summary helper
│   └── s3-schemes.js                # S3 scheme fetching with 30-min cache
├── data/
│   └── schemes.json                 # 21 flagship government schemes (all with lastUpdated)
├── lambda/
│   ├── chat-handler.js              # Standalone Lambda handler for chat/Bedrock
│   ├── refresh-handler.js           # Lambda handler for EventBridge 48h cron
│   └── schemes-summary.json         # Schemes data for Lambda cold start
├── amplify.yml                      # AWS Amplify build config
├── vercel.json                      # (kept for reference — cron now on EventBridge)
├── .env.local                       # AWS credentials + config (never committed)
├── tailwind.config.js
├── next.config.js                   # output: standalone (Amplify compatible)
└── package.json
```

---

## Schemes Database (21 Flagship Schemes)

| # | Scheme ID | Name | Category |
|---|-----------|------|----------|
| 1 | `pm-kisan` | PM-KISAN | Agriculture |
| 2 | `ayushman-bharat` | Ayushman Bharat - PMJAY | Health |
| 3 | `pmay-gramin` | PMAY-G (Rural Housing) | Housing |
| 4 | `pmuy` | PM Ujjwala Yojana | Energy |
| 5 | `mgnrega` | MGNREGA | Employment |
| 6 | `pm-mudra` | PM Mudra Yojana | Finance |
| 7 | `pmsby` | PMSBY (Accident Insurance) | Insurance |
| 8 | `pmjjby` | PMJJBY (Life Insurance) | Insurance |
| 9 | `pmmvy` | PMMVY (Maternity Benefit) | Women |
| 10 | `ignoaps` | IGNOAPS (Old Age Pension) | Social Security |
| 11 | `ignwps` | IGNWPS (Widow Pension) | Women |
| 12 | `igndps` | IGNDPS (Disability Pension) | Disability |
| 13 | `sukanya-samriddhi` | Sukanya Samriddhi Yojana | Women/Children |
| 14 | `pm-fasal-bima` | PM Fasal Bima Yojana | Agriculture |
| 15 | `nsp-scholarship` | NSP Scholarship | Education |
| 16 | `pm-jan-dhan` | PM Jan Dhan Yojana | Finance |
| 17 | `kisan-credit-card` | Kisan Credit Card | Agriculture |
| 18 | `pm-svnidhi` | PM SVANidhi (Street Vendor) | Urban Livelihood |
| 19 | `atal-pension` | Atal Pension Yojana | Retirement |
| 20 | `pmgkay` | PM Garib Kalyan Anna Yojana | Food Security |
| 21 | `bbbp` | Beti Bachao Beti Padhao | Women/Children |

All 21 schemes have `lastUpdated` dates (Feb 2025) displayed on scheme cards.

---

## API Endpoints

### `POST /api/chat`
- Accepts: `{ messages: [], language: "hi|kn|ta|te|en" }`
- Returns: `{ success, data: { message, detected_language, matched_scheme_ids, extracted_profile, follow_up_needed, follow_up_question } }`
- Uses Amazon Bedrock (Nova Pro) for AI inference
- 30-minute in-memory response cache (max 200 entries)
- 5-language fallback responses when Bedrock is unavailable

### `POST /api/speak`
- Accepts: `{ text, language }`
- Returns: `{ source: "polly"|"browser", audioData?, browserLang }`
- Uses AWS Polly if credentials present, else returns config for browser TTS

### `POST /api/transcribe`
- Accepts: base64 audio blob
- Returns: `{ transcript }` or `{ fallback: true }` if S3 not configured
- Uploads audio to S3 → Amazon Transcribe → returns text

### `GET|POST|DELETE /api/session`
- GET `?sessionId=xxx` — retrieve session from DynamoDB
- POST `{ sessionId, language, messages, profile }` — save/update session
- DELETE `?sessionId=xxx` — clear session on reset
- Falls back to in-memory Map if DynamoDB not configured
- 24-hour TTL on DynamoDB items

### `GET /api/music`
- Proxies background music from archive.org
- Bypasses CORS restrictions
- Removes need for 72MB file in repo

### `GET|POST /api/refresh-schemes`
- GET — returns scheme metadata (count, lastUpdated, source)
- POST `{ secret? }` — invalidates S3 cache, re-fetches fresh scheme data
- Triggered by AWS EventBridge every 48 hours

---

## AWS Architecture

```
User (Browser)
    │
    ├─ Voice Input ──► Web Speech API (browser STT)
    │                       │ fallback
    │               Amazon Transcribe ◄─ Audio via S3
    │
    ├─ Text/Voice ──► AWS Amplify (CloudFront + S3 frontend)
    │                       │
    │               API Gateway ──► Lambda (Next.js API routes)
    │                       │
    │               /api/chat ──► Amazon Bedrock (Nova Pro)
    │               /api/speak ──► Amazon Polly ──► audio/mpeg
    │               /api/session ──► Amazon DynamoDB
    │               /api/transcribe ──► Amazon S3 + Transcribe
    │               /api/music ──► archive.org (proxied)
    │
    └─ Scheme Data ──► Amazon S3 (schemes.json, 30-min cache)
                            │ fallback
                       Local data/schemes.json

Cron (every 48h):
  AWS EventBridge ──► Lambda (refresh-handler.js) ──► /api/refresh-schemes

Lambda Standalone:
  chat-handler.js   ── Bedrock Nova Pro (alternative deployment)
  refresh-handler.js ── EventBridge-triggered scheme refresh
```

---

## AWS Services Used

| Service | Purpose | Status |
|---------|---------|--------|
| Amazon Bedrock (Nova Pro) | AI scheme matching + multilingual responses | ✅ Active |
| Amazon Polly | High-quality TTS in Indian languages | ✅ Active |
| Amazon Transcribe | Server-side speech-to-text | ✅ Active |
| Amazon S3 | Scheme data storage + Transcribe audio staging | ✅ Active |
| Amazon DynamoDB | Session/conversation persistence with TTL | ✅ Active |
| AWS Lambda | Serverless API routes (Amplify-managed) + cron handler | ✅ Active |
| Amazon API Gateway | REST API routing (Amplify-managed) | ✅ Active |
| AWS Amplify | Full-stack hosting (frontend + Lambda-backed API) | ✅ Deployed |
| AWS EventBridge | 48h cron trigger for scheme refresh | ✅ Configured |

---

## Environment Variables

```bash
# Required
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Optional (enable S3 scheme storage)
AWS_S3_BUCKET=yojna-setu-schemes

# Optional (enable DynamoDB sessions)
DYNAMODB_TABLE=YojnaSetuSessions

# Optional (secure scheme refresh endpoint)
REFRESH_SECRET=your-secret-here

# App config
NEXT_PUBLIC_APP_NAME=Yojna-Setu
NEXT_PUBLIC_APP_URL=https://<amplify-url>.amplifyapp.com
```

---

## IAM Permissions Required

Your AWS IAM user/role needs:
- `AmazonBedrockFullAccess` — for Nova Pro inference
- `AmazonPollyFullAccess` — for TTS
- `AmazonTranscribeFullAccess` — for STT
- `AmazonS3FullAccess` (or scoped to bucket) — for scheme data + audio
- `AmazonDynamoDBFullAccess` (or scoped to table) — for sessions

---

## AWS Amplify Deployment

### Steps
1. Push to GitHub (already done)
2. AWS Console → Amplify → Create new app → Host web app → GitHub → `Yojna-Sethu` repo → `main` branch
3. Auto-detects `amplify.yml` — click Next → Save and deploy
4. Add environment variables in Amplify Console (Environment variables section)
5. Update `NEXT_PUBLIC_APP_URL` with the Amplify-assigned URL after first deploy

### EventBridge Cron Setup
1. AWS Console → EventBridge → Rules → Create rule
2. Schedule: `rate(48 hours)`
3. Target: API destination → `https://<amplify-url>/api/refresh-schemes` (POST)

### Build Config (`amplify.yml`)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

---

## Requirements Coverage Matrix

| Req | Description | Status |
|-----|-------------|--------|
| 1.1 | Voice input (mic button, Web Speech API, waveform animation) | ✅ Done |
| 1.2 | Language selection screen + per-language UI strings | ✅ Done |
| 2.3 | Conflict detection in AI responses | ✅ Done |
| 4.1 | Auto-play TTS after voice input (Polly + browser synthesis) | ✅ Done |
| 4.5 | Response segmentation at 180 words | ✅ Done |
| 5.5 | Conversation summarization after 3+ turns | ✅ Done |
| 7.2 | Offline detection banner | ✅ Done |
| 7.4 | 30-min in-memory response cache + fallbacks | ✅ Done |
| 7.5 | Localized error messages (5 languages) | ✅ Done |
| 8.3 | Typing indicator with wait time estimate | ✅ Done |
| 8.5 | Help modal with 5-step guide (5 languages) | ✅ Done |
| 9.1 | Amazon Transcribe STT endpoint | ✅ Done |
| 9.4 | S3 scheme data with local fallback | ✅ Done |
| 9.5 | AWS Lambda handlers (chat + refresh) | ✅ Done |
| 10.1 | `lastUpdated` on all schemes + SchemeCard badge | ✅ Done |
| 10.2 | 48h cron refresh (EventBridge + Lambda) | ✅ Done |
| 10.3 | YES/NO eligibility questions + checkboxes | ✅ Done |
| 10.4 | State-specific benefit amounts | ✅ Done |
| 10.5 | ⚠️ Time-sensitive deadline flagging | ✅ Done |
| — | Silence auto-stop (3.5s timer in VoiceButton) | ✅ Done |
| — | TTS preprocessing (₹/lakh/crore amounts + markdown strip) | ✅ Done |
| — | AbortController for language-switch race condition | ✅ Done |
| — | Voice pre-loading via `voiceschanged` event | ✅ Done |

---

## Chat UI Features

### Voice Features
- Mic button with waveform animation, ripple rings, localized status text
- Amazon Transcribe fallback for server-side STT
- Auto-play TTS (Polly or browser synthesis) only after voice input
- Silence auto-stop — 3.5s timer auto-submits after no speech
- Localized mic status in all 5 languages

### Language Support
- Full-screen language picker (on first load and via header button)
- 5 languages: Hindi, Kannada, Tamil, Telugu, English
- All UI strings translated in all 5 languages
- Language switch clears all state instantly + cancels in-flight requests via AbortController

### TTS — Text-to-Speech
- Hindi/English: Amazon Polly (Kajal neural hi-IN, Raveena en-IN)
- Kannada/Tamil/Telugu: Browser Speech Synthesis with native language codes
- `preprocessForTTS()` — strips markdown, converts `₹1.5 lakh` → `1.5 lakh rupees`, handles per-year/month/day
- Voices pre-loaded via `voiceschanged` event to fix async empty `getVoices()`

### Scheme Results
- Scheme cards shown inline below AI messages (collapsible)
- Right sidebar panel (visible on md+ screens) shows matched schemes persistently
- Each SchemeCard: category badge, benefit amount, documents, howToApply, website link
- `lastUpdated` badge on every card

### UI / UX
- Splash screen with 6-phase animation → smooth crossfade to landing page
- Indian flag tricolor theme (saffron #FF9933 → white → green #138808)
- Background music via `/api/music` proxy (auto-starts, 18% volume, from 8s mark, fades on navigation)
- Offline detection banner
- Help modal in user's language

---

## Recent Changes (March 8, 2026)

### AWS Amplify Migration
- Created `amplify.yml` build config
- Added `output: 'standalone'` to `next.config.js` for Amplify compatibility
- Switched background music source from `/bg-music.mp3` (72MB local file) to `/api/music` proxy
- Added `public/bg-music.mp3` to `.gitignore` (too large for repo)
- Deployment target: AWS Amplify (Lambda-backed Next.js) instead of Vercel
- Cron: AWS EventBridge 48h rule → `/api/refresh-schemes` (replaces Vercel Cron)

### Bug Fixes
- **TTS not reading ₹ amounts** — Improved `preprocessForTTS()` regex: now handles `₹1.5 lakh`, `₹50,000 crore`, and regional lakh/crore words in all 5 languages
- **Language dropdown overlapping** — Removed inline dropdown from chat header; replaced with button that opens full-screen `LanguagePicker` (same as initial load)
- **Kannada schemes panel missing** — Changed `hidden lg:flex` → `hidden md:flex` so schemes sidebar shows on tablets and smaller desktops
- **Background music not starting** — Added `audio.preload = 'auto'`; moved `audio.currentTime = 8` to fire after `canplay` event (fixes seek failure on 72MB file before metadata loads)

### Earlier UI Changes (same session)
- Splash → landing page smooth crossfade transition
- Volume reduced to 18%, music starts from 8-second mark
- Music auto-starts on page load (muted autoplay → unmutes on first interaction)
- Music stops when navigating away from landing page
- Indian flag tricolor hero text gradient
- Inline language dropdown added then reverted to full-screen picker

---

## Build Status

```
✓ Compiled successfully
Route (app)                              Size     First Load JS
├ ○ /                                    6.07 kB         131 kB
├ ƒ /api/chat                            0 B                0 B
├ ƒ /api/music                           0 B                0 B
├ ƒ /api/refresh-schemes                 0 B                0 B
├ ƒ /api/session                         0 B                0 B
├ ƒ /api/speak                           0 B                0 B
├ ƒ /api/transcribe                      0 B                0 B
└ ○ /chat                                28.9 kB         154 kB
```

---

## Running Locally

```bash
cd "c:/Users/shree/OneDrive/Desktop/AI FOR BHARAT/yojna-setu"
npm install
# add .env.local with AWS credentials
npm run dev
# open http://localhost:3000
```

---

*Last updated: March 8, 2026 — Team NON-NEGOTIATORS*
