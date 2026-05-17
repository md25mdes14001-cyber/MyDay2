# myday2 - AI-Powered Second Brain

myday2 is a minimalist AI life operating system and second-brain platform that helps you manage tasks, habits, goals, and routines with an intelligent engine.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd myday2
npm install
```

### 2. Configure Environment Variables
Make sure you have your `.env` configured.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/myday2"
NEXTAUTH_SECRET="your-secret"
OPENAI_API_KEY="your-openai-api-key"
```

### 3. Setup Database (Prisma)
If you have a PostgreSQL database running, execute:
```bash
npx prisma db push
npx prisma generate
```

### 4. Run the Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture
- **Frontend**: Next.js 15 (App Router), React, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: NextAuth.js
- **AI**: OpenAI integration for goal decomposition, planning, and task breakdown.

## ✨ Features implemented
- Premium Minimal UI / Dark-light aesthetics
- Framer Motion micro-interactions
- Database Schema designed for Goals, Tasks, Habits, AI Plans, Insights
- Dashboard Core Layout
- Landing Page
