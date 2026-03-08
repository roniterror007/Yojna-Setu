# योजना-सेतु (Yojna-Setu)
### Your Voice. Your Language. Your Rights.

> AI for Bharat Hackathon 2026 | Team NON-NEGOTIATORS | PS03 - AI for Communities, Access & Public Impact

---

## What is Yojna-Setu?

Yojna-Setu is a **voice-first AI assistant** that helps rural Indians discover government welfare schemes they qualify for — in their native language (Hindi, Kannada, Tamil, Telugu, or English).

**The Problem**: ₹1+ lakh crore of government welfare goes unclaimed annually because people don't know what schemes exist, don't know they qualify, and face language/digital barriers.

**The Solution**: Just speak in your language → AI matches you to schemes → Get audio guidance in your language.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| AI/NLU | Anthropic API |
| Speech Input | Web Speech API (browser-native) |
| Text-to-Speech | AWS Polly (primary) + Browser Speech Synthesis (fallback) |
| Database | JSON schemes database (20+ schemes) |
| Deployment | Vercel (frontend + API routes) |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm or yarn
- Anthropic API key (get from https://console.anthropic.com/)

### Setup

```bash
# 1. Clone / navigate to project
cd yojna-setu

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# 4. Start development server
npm run dev
```

Open http://localhost:3000

### .env.local Setup

```env
# Required
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional (for AWS Polly TTS - higher quality voice)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
```

---

## Deployment to Vercel (Free - Get Working Link)

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables when prompted
# Or go to Vercel dashboard → Settings → Environment Variables
```

### Option 2: GitHub + Vercel (Recommended)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "feat: initial Yojna-Setu prototype"
git remote add origin https://github.com/yourusername/yojna-setu.git
git push -u origin main
```

2. Go to https://vercel.com → Import Project → Select your repo
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy! (Takes ~2 minutes)
5. Get your live URL: `https://yojna-setu.vercel.app`

---

## AWS Integration (When Credits Arrive)

### Services Used
1. **Amazon Polly** - Text-to-Speech in Indian languages
2. **Amazon Transcribe** - Speech-to-Text (enhance voice input)
3. **Amazon S3** - Store schemes database
5. **AWS Lambda** - Serverless API functions
6. **Amazon DynamoDB** - Session storage

### Enabling AWS Polly TTS
Once you have AWS credits:
```bash
# Add to .env.local
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
```
The app automatically uses Polly when credentials are present.

### IAM Policy Required
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["polly:SynthesizeSpeech", "polly:DescribeVoices"],
    "Resource": "*"
  }]
}
```

---

## Features

### Core Features (Working Now)
- **Voice Input**: Click mic → speak → automatic transcription
- **Multi-language**: Hindi, Kannada, Tamil, Telugu, English
- **AI Matching**: Extract user profile and match to 20+ government schemes
- **Voice Output**: Hear the response in your language (browser TTS, Polly when configured)
- **Scheme Cards**: Detailed cards with eligibility, documents, how to apply
- **Follow-up Q&A**: Multi-turn conversation with context memory
- **Sample Prompts**: Try example queries without typing

### Schemes Database (20+ Schemes)
- PM-KISAN (₹6,000/year for farmers)
- Ayushman Bharat (₹5 lakh health insurance)
- PMAY-G (₹1.20 lakh housing subsidy)
- PM Ujjwala Yojana (Free LPG)
- MGNREGA (100 days employment)
- PM Mudra Yojana (Business loans to ₹10 lakh)
- PMSBY (Accident insurance ₹20/year)
- PMJJBY (Life insurance ₹436/year)
- PMMVY (Maternity benefit ₹5,000)
- Old Age Pension, Widow Pension, Disability Pension
- Sukanya Samriddhi, PM Fasal Bima
- National Scholarships, PM Jan Dhan, Kisan Credit Card
- PM SVANidhi, Atal Pension Yojana
- And more...

---

## Demo Video Script

**Suggested demo flow:**
1. Open app → show language selection (switch to Hindi)
2. Click voice button → say "मैं राजस्थान से हूँ, किसान हूँ, BPL कार्ड है"
3. Show AI response listing PM-KISAN, MGNREGA, Ayushman Bharat
4. Click speak button → show audio response
5. Switch to Tamil → show sample query → show Tamil response
6. Show scheme cards with application details

---

## Architecture

```
User Voice → Web Speech API → Text
                                ↓
                         /api/chat (AI Service)
                                ↓
                    Scheme matching + Profile extraction
                                ↓
                         Response in user language
                                ↓
                    /api/speak (AWS Polly / Browser TTS)
                                ↓
                         Audio output + Scheme cards
```

---

## Team
**NON-NEGOTIATORS**
- Team Leader: Shreeya S Methuku
- Problem Statement: PS03 - AI for Communities, Access & Public Impact

---

## License
MIT - Open source for public good
