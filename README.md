<div align="center">

# 🧠⚡ StudyOS
### The AI-Native, Full-Stack, Production-Grade Academic Operating System

*Not a to-do list. A cognition layer for your entire academic life.*

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-RLS%20Hardened-3ECF8E?style=for-the-badge&logo=supabase)
![Gemini](https://img.shields.io/badge/Gemini-Multimodal%20AI-8B5CF6?style=for-the-badge&logo=googlegemini)
![Security](https://img.shields.io/badge/npm%20audit-0%20vulnerabilities-success?style=for-the-badge)

</div>

---

## 🚀 TL;DR

StudyOS is a **full-stack, AI-native, real-time, multimodal, security-audited academic productivity platform** that turns raw, unstructured syllabus chaos into a living, adaptive, self-optimizing study system — engineered end-to-end by one person, from schema to deployment.

This isn't a CRUD app with a chatbot bolted on. This is **an intelligence layer sitting on top of your entire academic workload.**

---

## 🔥 Flagship Capabilities

### 🤖 Generative AI Study Planner
LLM-orchestrated, constraint-aware scheduling engine. Ingests topics, deadlines, and availability windows, then **reasons** over them to produce an optimized day-by-day study trajectory — complete with transparent conflict surfacing when the laws of physics (24 hours/day) get in the way.

### 📸 Multimodal Syllabus Ingestion Pipeline
Point a camera at a syllabus. Walk away with a fully structured course, topic list, and exam calendar. **Vision-model-powered zero-manual-entry onboarding**, with a human-in-the-loop confirmation layer for trust and control.

### 💬 Context-Grounded AI Tutor
A chatbot that actually *knows your classes* — grounded, retrieval-informed conversation scoped to your real curriculum. Not a generic wrapper around a generic model answering generic questions.

### 🎛️ Fully Customizable, Persistent, Drag-and-Drop Command Center
Rearrange your world. Widget-level drag-and-drop, per-user persistence, real-time data binding, and a **bespoke neumorphic design system** with live theme-switching — because your dashboard should look like *your* dashboard.

### 🗓️ Native Calendar Visualization Engine
Full month-grid rendering of AI-generated plans with per-day drill-down. No more scrolling through a wall of text to find out what Tuesday holds.

### 🔗 Relational Knowledge Graph (Lite)
Notes ↔ Courses ↔ Topics. Habits ↔ Weekday scheduling. Tasks ↔ Courses. Everything connects to everything, because your brain doesn't work in silos and neither should your tools.

---

## 🏛️ Engineering Architecture

| Layer | Stack | Why It Slaps |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) + TypeScript + Tailwind | Server Components, type-safety end to end |
| **Backend** | Server Actions + API Routes | Zero unnecessary client/server round-trips |
| **Database** | Supabase (PostgreSQL) | Row-Level Security enforced on **every single table** |
| **Auth** | Supabase Auth | Server-enforced route protection, zero client-only gating |
| **AI Layer** | Google Gemini (multimodal, structured JSON generation) | Vision + reasoning, one API |
| **Design System** | Custom neumorphic tokens | Not a template. Not shadcn defaults. Bespoke. |
| **Deployment** | Vercel | Push-to-ship CI/CD |

---

## 🛡️ Security Posture: Locked Down

- ✅ **Row-Level Security** on every table — verified via *empirical unauthenticated penetration testing*, not just policy review
- ✅ **Zero client-side secret exposure** — all API credentials server-side only
- ✅ **Auth-gated API routes** — unauthenticated requests rejected before a single token of LLM compute is spent
- ✅ **Validated, size-capped, type-restricted file uploads**
- ✅ **`npm audit`: 0 vulnerabilities** — including a patched Next.js RCE and libheif/sharp CVE, caught and remediated pre-launch

---

## ⚙️ Quickstart

```bash
npm install
npm run dev
```

**Environment configuration** (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
GEMINI_API_KEY=
```

Database schema + RLS policies live in `supabase/migrations/` — apply sequentially via the Supabase SQL editor.

---

## 🗺️ What's Next

- 🔁 Event-driven automation engine (exam-added → auto-replan)
- 📅 Google Calendar sync
- 📱 PWA / installable mobile experience

---

<div align="center">

### 🏗️ Built solo. Zero boilerplate templates. Zero shortcuts on security.
**A full-stack AI application, engineered from empty repo to production deploy.**

</div>
