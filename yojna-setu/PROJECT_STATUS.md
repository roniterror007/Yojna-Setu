# Yojna-Setu — Complete Implementation Status
**Team:** NON-NEGOTIATORS | **Hackathon:** AI for Bharat 2026 | **Problem:** PS03

---

## Project Overview

Yojna-Setu (योजना-सेतु) is a voice-first, multilingual AI assistant that helps rural Indians discover and apply for government welfare schemes. It works in Hindi, Kannada, Tamil, Telugu, and English — designed for 350 million citizens with limited literacy and internet access.

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
| Serverless | AWS Lambda + API Gateway |
| Deployment | Vercel (frontend) + AWS (backend services) |
| Scheduling | Vercel Cron Jobs (48h scheme refresh) |

---

## File Structure

```
yojna-setu/
├── app/
│   ├── page.js                      # Landing page
│   ├── chat/
│   │   └── page.js                  # Main chat UI (948 lines)
│   └── api/
│       ├── chat/route.js            # AI scheme matching (302 lines)
│       ├── speak/route.js           # TTS — Polly + browser fallback (98 lines)
│       ├── transcribe/route.js      # STT — Amazon Transcribe (125 lines)
│       ├── session/route.js         # DynamoDB session persistence (156 lines)
│       └── refresh-schemes/route.js # 48h scheme cache invalidation
├── components/
│   ├── SchemeCard.jsx               # Scheme card with lastUpdated badge
│   ├── VoiceButton.jsx              # Mic button with Web Speech API
│   ├── LanguageSelector.jsx         # 5-language switcher
│   ├── SamplePrompts.jsx            # Suggested prompts per language
│   ├── ConversationMessage.jsx      # Chat message bubble
│   ├── DynamicGlow.jsx              # Background animation
│   └── LoadingDots.jsx              # Typing indicator
├── lib/
│   ├── schemes.js                   # Local scheme data + AI summary helper
│   └── s3-schemes.js                # S3 scheme fetching with 30-min cache
├── data/
│   └── schemes.json                 # 21 flagship government schemes
├── lambda/
│   ├── chat-handler.js              # Standalone Lambda for chat/Bedrock
│   ├── refresh-handler.js           # Lambda cron for 48h scheme refresh
│   └── schemes-summary.json         # Schemes data for Lambda cold start
├── vercel.json                      # Vercel cron: every 48h
├── .env.local                       # AWS credentials + config
├── tailwind.config.js
├── next.config.js
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
- Detailed IAM error messages for setup guidance

### `POST /api/speak`
- Accepts: `{ text, language }`
- Returns: `{ source: "polly"|"browser", audioData?, browserLang }`
- Uses AWS Polly if credentials present, else returns config for browser TTS

### `POST /api/transcribe`
- Accepts: base64 audio blob
- Returns: `{ transcript }` or `{ fallback: true }` if S3 not configured
- Uploads audio to S3 → Amazon Transcribe → returns text
- Client falls back to Web Speech API if `fallback: true`

### `GET|POST|DELETE /api/session`
- GET `?sessionId=xxx` — retrieve conversation session from DynamoDB
- POST `{ sessionId, language, messages, profile }` — save/update session
- DELETE `?sessionId=xxx` — clear session on reset
- Falls back to in-memory Map if DynamoDB not configured
- 24-hour TTL on DynamoDB items

### `GET|POST /api/refresh-schemes`
- GET — returns scheme metadata (count, lastUpdated, source)
- POST `{ secret? }` — invalidates S3 cache, re-fetches fresh scheme data
- Called automatically by Vercel cron every 48 hours

---

## AI System Prompt Features

The system prompt in `app/api/chat/route.js` implements all requirements:

### Core Behavior
- Responds ONLY in user-selected language (hi/kn/ta/te/en)
- Warm, simple language — avoids bureaucratic jargon
- Bullet-point format for all scheme listings (`•`)
- Bold scheme names with `**double asterisks**`

### Req 10.3 — Eligibility Simplification
- Breaks eligibility into YES/NO questions
- Uses checkbox format: ✓ confirmed, ? unknown, ✗ not met

### Req 10.4 — Location-Specific Benefits
- MGNREGA state wages: UP ₹213/day, Karnataka ₹309/day, Kerala ₹333/day, Tamil Nadu ₹256/day, Andhra ₹257/day, Maharashtra ₹273/day
- PMAY-G: plains ₹1.20 lakh, hilly/NE ₹1.30 lakh
- Pension state top-ups noted

### Req 10.5 — Time-Sensitive Deadlines
- ⚠️ PMMVY: Register within 150 days of pregnancy
- ⚠️ PM Fasal Bima: Kharif July / Rabi December cutoff
- ⚠️ NSP Scholarship: Oct–Nov application window
- ⚠️ Kisan Credit Card: Before crop sowing season

### Req 2.3 — Conflict Detection
- Detects contradictory info (e.g., government employee asking for PM-KISAN)
- Gently flags and seeks clarification before recommending

### Req 5.5 — Conversation Summary
- After 3+ turns, summarizes understood profile and confirms before recommending
- Format: state, occupation, income, family details

### Nearest Application Centers (PDF USP)
- CSC (Common Service Centre) — every Gram Panchayat
- Gram Panchayat Office — MGNREGA, PMAY-G, pensions
- Anganwadi Centre — PMMVY, ICDS, PM Poshan
- Bank/Post Office — PM-KISAN, PM-MUDRA, Jan Dhan
- Ration Shop — PMGKAY, Antyodaya cards
- School/College — NSP Scholarship, PM Vidyalakshmi
- Always mentions: `umang.gov.in`, `DigiLocker`, `cscindia.org`

### Comprehensive Scheme Coverage (PDF USP)
- 21 flagship schemes in database
- Directs users to `myscheme.gov.in` (700+ central + state schemes)
- `jansamarth.in` — 13 credit-linked schemes
- UMANG App — 1,200+ government services
- State portals: up.gov.in, karnataka.gov.in, tnschemes.in, ap.gov.in, telangana.gov.in

---

## Chat UI Features (app/chat/page.js)

### Voice Features
- **Req 1.1** — Mic button (Web Speech API) with waveform animation, ripple rings, localized status text
- **Req 9.1** — Amazon Transcribe fallback for server-side STT
- **Req 4.1** — Auto-play TTS (Polly or browser synthesis) only after voice input (not after typed messages)
- **Silence auto-stop** — VoiceButton auto-stops and submits after 3.5 seconds of silence (via `silenceTimerRef` reset on each `onresult` event)
- **Localized mic status** — "बोलने के लिए टैप करें", "ಮಾತನಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ", "பேச தட்டவும்", etc. for all 5 languages

### Language Support
- **Full-screen language picker** on first load — animated language cards before chat UI appears
- 5 languages: Hindi (हिंदी), Kannada (ಕನ್ನಡ), Tamil (தமிழ்), Telugu (తెలుగు), English
- All UI strings (placeholders, errors, help text, wait times) translated in all 5 languages
- Language switch clears all state (messages, history, schemes, TTS, voice) instantly
- User-selected language is always trusted — AI's `detected_language` field is NOT used to auto-switch the UI language (prevents incorrect language switching)
- Language pills in header (desktop) + floating picker button (mobile)

### TTS — Text-to-Speech
- **Hindi/English** — Amazon Polly: Kajal (neural hi-IN), Raveena (standard en-IN)
- **Kannada/Tamil/Telugu** — Browser Speech Synthesis with native language codes; requires OS language pack
- **`preprocessForTTS()`** — strips markdown (`**bold**`, `# headers`), converts `₹220/day` → `220 rupees per day`, `₹6000/year` → `6000 rupees per year`, cleans up slashes before TTS
- **`voicesRef`** — pre-loaded via `voiceschanged` event (fixes async empty `getVoices()` on first load)
- **AbortController** — in-flight `/api/chat` requests are cancelled immediately on language switch, preventing stale responses from rendering

### Conversation
- **Req 4.5** — Response segmentation: splits responses >180 words at paragraph breaks with "Part 1/2" labels
- **Req 5.5** — Multi-turn conversation with full `conversationHistory` array sent to API
- **Req 7.4** — 30-min server-side cache for identical queries
- **Req 8.3** — Typing indicator shows estimated wait time (`~3-8 seconds`) in user's language
- DynamoDB session persistence: saves last 20 turns after each AI response, deletes on reset

### Scheme Results
- **Req 10.1** — SchemeCard displays `lastUpdated` badge (Clock icon, "Updated Feb 2025")
- Inline scheme cards below messages (collapsible with ChevronUp toggle)
- Each SchemeCard shows: category badge, benefit amount, document list, howToApply, website ExternalLink button
- 2-column grid on desktop, single column on mobile

### Sample Prompts
- 6 suggested prompts per language (farmer, widow, pregnant, student, small business, street vendor)
- 2-column grid layout with emoji icons
- Disappear once conversation starts

### Accessibility & UX
- **Req 7.2** — Offline detection banner (WifiOff icon, amber) with `navigator.onLine` + browser events
- **Req 7.5** — Localized error messages: networkError, awsError, generic error in user's language
- **Req 8.5** — Help modal: 5-step guide in user's language + in-modal language switcher
- Framer Motion animations: bubble fade-in, avatar pop, typing indicator bounce, language picker slide-up

---

## AWS Architecture

```
User (Browser)
    │
    ├─ Voice Input ──► Web Speech API (browser STT)
    │                       │ fallback
    │               Amazon Transcribe ◄─ Audio via S3
    │
    ├─ Text/Voice ──► Next.js Frontend (Vercel)
    │                       │
    │               /api/chat ──► Amazon Bedrock (Nova Pro)
    │                       │           │
    │               /api/speak ──► Amazon Polly ──► audio/mpeg
    │                       │
    │               /api/session ──► Amazon DynamoDB
    │                       │         (YojnaSetuSessions table)
    │               /api/transcribe ──► Amazon S3 + Transcribe
    │
    └─ Scheme Data ──► Amazon S3 (schemes.json, 30-min cache)
                            │ fallback
                       Local data/schemes.json

Cron (every 48h):
  Vercel Cron ──► /api/refresh-schemes ──► Invalidate S3 cache
  AWS EventBridge ──► Lambda (refresh-handler.js) ──► /api/refresh-schemes

Lambda Standalone (API Gateway):
  POST /chat ──► chat-handler.js ──► Amazon Bedrock (Nova Pro)
```

---

## AWS Services Used

| Service | Purpose | Status |
|---------|---------|--------|
| Amazon Bedrock (Nova Pro) | AI scheme matching + multilingual responses | ✅ Implemented |
| Amazon Polly | High-quality TTS in Indian languages | ✅ Implemented |
| Amazon Transcribe | Server-side speech-to-text | ✅ Implemented |
| Amazon S3 | Scheme data storage + audio files | ✅ Implemented |
| Amazon DynamoDB | Session/conversation persistence | ✅ Implemented |
| AWS Lambda | Serverless chat + cron handlers | ✅ Implemented |
| Amazon API Gateway | REST API for Lambda functions | ✅ (Lambda ready) |

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
NEXT_PUBLIC_APP_URL=https://yojna-setu.vercel.app
```

---

## IAM Permissions Required

Your AWS IAM user/role needs:
- `AmazonBedrockFullAccess` — for Nova Pro inference
- `AmazonPollyFullAccess` — for TTS
- `AmazonTranscribeFullAccess` — for STT
- `AmazonS3FullAccess` (or scoped to bucket) — for scheme data
- `AmazonDynamoDBFullAccess` (or scoped to table) — for sessions

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
| 10.2 | 48h cron refresh (Vercel + Lambda) | ✅ Done |
| 10.3 | YES/NO eligibility questions + checkboxes | ✅ Done |
| 10.4 | State-specific benefit amounts | ✅ Done |
| 10.5 | ⚠️ Time-sensitive deadline flagging | ✅ Done |
| — | Silence auto-stop (3.5s timer in VoiceButton) | ✅ Done |
| — | TTS text preprocessing (slash/₹ normalization) | ✅ Done |
| — | AbortController for language-switch race condition | ✅ Done |
| — | Voice pre-loading via `voiceschanged` event | ✅ Done |

---

## PDF Claims vs Implementation

| PDF Claim | Implemented |
|-----------|-------------|
| Voice-first interface | ✅ Web Speech API + Amazon Transcribe |
| Hindi, Kannada, Tamil, Telugu support | ✅ All 5 languages (+ English) |
| Multi-turn conversations | ✅ Full conversationHistory array |
| AI-powered scheme matching | ✅ Amazon Bedrock Nova Pro |
| Audio responses in native language | ✅ Amazon Polly + browser synthesis |
| Amazon Bedrock | ✅ Nova Pro via ConverseCommand |
| Amazon Polly | ✅ Implemented |
| Amazon Transcribe | ✅ Implemented |
| Amazon S3 | ✅ Scheme storage + Transcribe audio |
| Amazon DynamoDB | ✅ Session persistence (GET/POST/DELETE) |
| AWS Lambda | ✅ chat-handler.js + refresh-handler.js |
| Amazon API Gateway | ✅ Lambda handlers ready to deploy |
| Constantly updated scheme database | ✅ 48h Vercel cron + Lambda EventBridge |
| Location-specific office information | ✅ CSC/Gram Panchayat/Anganwadi in AI prompts |
| 700+ schemes coverage | ✅ Bridged: myscheme.gov.in + state portals referenced |
| End-to-end guidance + document checklist | ✅ AI provides docs + nearest center |

---

## Running Locally

```bash
# 1. Navigate to project
cd "c:/Users/shree/OneDrive/Desktop/AI FOR BHARAT/yojna-setu"

# 2. Install dependencies (already done)
npm install

# 3. Add AWS credentials to .env.local
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=us-east-1

# 4. Start dev server
npm run dev

# 5. Open browser
# http://localhost:3000
```

## Deploying to Vercel

```bash
# Push to GitHub → connect repo to Vercel
# Add environment variables in Vercel dashboard
# Deploy automatically on push to main
```

---

## Build Status

```
✓ Compiled successfully
Route (app)                              Size     First Load JS
├ ○ /                                    6.07 kB         131 kB
├ ƒ /api/chat                            0 B                0 B
├ ƒ /api/refresh-schemes                 0 B                0 B
├ ƒ /api/session                         0 B                0 B
├ ƒ /api/speak                           0 B                0 B
├ ƒ /api/transcribe                      0 B                0 B
└ ○ /chat                                28.9 kB         154 kB
```

---

## Recent Changes (March 8, 2026)

### Bug Fixes
- **kn/ta/te TTS silent** — Fixed by pre-loading voices via `voiceschanged` event (`voicesRef`). Removed incorrect Hindi/English voice fallback that caused garbled audio for Kannada/Tamil/Telugu text.
- **Language switch keeps old context** — Fixed with `AbortController`: switching language now immediately cancels any in-flight `/api/chat` request. `AbortError` is caught and ignored silently.
- **AI responds in wrong language** — Fixed by removing `detected_language` auto-switch. UI language is now always the user's explicitly selected language. The AI's `detected_language` field is ignored for UI state changes.
- **Voice button doesn't stop after silence** — Fixed with `silenceTimerRef` in `VoiceButton`. Timer resets on every `onresult` event; after 3.5s of no speech, auto-stops and submits.
- **TTS reads `/` literally** — Fixed with `preprocessForTTS()`: `₹220/day` → `220 rupees per day`, `₹6000/year` → `6000 rupees per year`. Also strips `**bold**` and `# headers` before speaking.

---

*Last updated: March 8, 2026 — Team NON-NEGOTIATORS*
