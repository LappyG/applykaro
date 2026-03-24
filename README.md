# ApplyKaro — AI-Powered ATS Resume Scorer

## Deploy in 5 minutes

### Step 1: Install dependencies
```bash
cd applykaro
npm install
```

### Step 2: Add your API key
Open `.env.local` and replace with your real key:
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```
Get a key from: https://console.anthropic.com/

### Step 3: Test locally
```bash
npm run dev
```
Open http://localhost:3000

### Step 4: Deploy to Vercel (free)
```bash
npm i -g vercel
vercel
```
When asked, add your `ANTHROPIC_API_KEY` as an environment variable in Vercel dashboard.

### Step 5: Custom domain (optional)
Buy `applykaro.in` from GoDaddy/Namecheap/Hostinger (~₹200-500/year)
Add it in Vercel dashboard → Settings → Domains

## Tech Stack
- Next.js 15 + React 19
- Tailwind CSS v4
- Claude Sonnet API (server-side)
- PDF.js (client-side PDF parsing)
- Vercel (hosting, free tier)
