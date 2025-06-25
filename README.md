# Dionysus: AI-Powered GitHub SaaS Client

<p align="center">
  <img src="public/logo.png" alt="Dionysus Logo" width="120" />
</p>

<p align="center">
  <a href="https://render.com/"><img src="https://img.shields.io/badge/Deployed%20on-render-black?logo=render" alt="render" /></a>
  <a href="https://github.com/saksham-goel1107/dionysus"><img src="https://img.shields.io/github/stars/saksham-goel1107/dionysus?style=social" alt="GitHub stars" /></a>
  <a href="https://github.com/saksham-goel1107/dionysus/issues"><img src="https://img.shields.io/github/issues/saksham-goel1107/dionysus" alt="GitHub issues" /></a> 
  <img src="https://img.shields.io/badge/AI-Gemini%20%26%20Assembly%20AI-blueviolet" alt="AI" />
  <img src="https://img.shields.io/badge/Auth-Clerk-orange" alt="Clerk" />
  <img src="https://img.shields.io/badge/Frontend-Next-blue" alt="Next" />
  <img src="https://img.shields.io/badge/Database-Prisma%20%26%20PostgreSQL-4E8EE5" alt="Prisma" />
</p>

---

## 🚀 Overview

**Dionysus** is an advanced AI-powered SaaS platform for seamless GitHub project management and collaboration. Integrate your repositories, analyze commit histories, transcribe meetings, and collaborate with your team—all enhanced by state-of-the-art AI.

---

## 📂 Folder Structure

```
├── prisma/                # Database schema & migrations
├── public/                # Static assets (images, icons, manifest)
├── src/
│   ├── app/               # Next.js app directory (routing, layouts, pages)
│   │   ├── (protected)/   # Authenticated routes & features
│   │   ├── api/           # API route handlers
│   │   ├── components/    # UI components (navbar, footer, etc.)
│   │   ├── docs/          # Documentation pages
│   │   ├── privacy/       # Privacy policy
│   │   ├── sign-in/       # Sign-in pages
│   │   ├── sign-up/       # Sign-up pages
│   │   ├── sync-user/     # User sync page
│   │   ├── terms/         # Terms of service
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions (e.g., redis)
│   ├── components/        # Shared UI components (feedback, UI, updates)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Library code (AI, cloudinary, stripe, etc.)
│   ├── pages/             # (Legacy) Next.js pages
│   ├── server/            # Server-side logic (db, API)
│   ├── styles/            # Global styles (Tailwind, CSS)
│   ├── trpc/              # tRPC client/server setup
│   └── types/             # Shared types
├── .env*                  # Environment variables (not included)
├── package.json           # Project metadata & scripts
├── README.md              # Project documentation
└── ...                    # Other configs & docs
```

---

## ✨ Features

### 🔗 GitHub Integration
- **Connect Repositories:** Link your GitHub projects with a single URL.
- **Commit History Explorer:** Visualize and analyze the entire commit history.
- **AI-Powered Insights:** Ask questions about your codebase and get instant, context-aware answers.

### 📝 AI-Powered Audio Transcription & Summarization
- **Audio Uploads:** Upload meeting recordings in various formats.
- **Transcription:** Receive accurate, timestamped transcripts powered by Assembly AI.
- **Summarization:** Get concise, AI-generated meeting summaries for quick review.

### 👥 Team Collaboration
- **Invite Members:** Add teammates via unique invitation URLs.
- **Real-Time Collaboration:** Work together on projects, share insights, and manage tasks.
- **Project Sharing:** Seamlessly share project access and updates.

### 🤖 AI Assistance
- **Gemini AI Integration:** Leverage Gemini AI for repository Q&A, code explanations, and workflow suggestions.
- **Smart Suggestions:** Get recommendations for code improvements and project management.

### 💳 Credit-Based Pricing
- **Transparent Pricing:** Purchase credits (e.g., 50 credits for 75 INR).
- **Usage-Based:** Each audio upload deducts 1 credit—pay only for what you use.

### 🔒 Authentication & Security
- **Clerk Integration:** Secure, seamless authentication and account management.
- **Role-Based Access:** Ensure only authorized users can access sensitive features.

---

## 🛠️ Tech Stack

- **Frontend:** React, Next.js, Tailwind CSS
- **Backend:** Node.js, tRPC, Prisma ORM, PostgreSQL
- **AI:** Gemini AI (Q&A, code insights), Assembly AI (audio transcription)
- **Authentication:** Clerk
- **Deployment:** Vercel

---

## 🚦 Getting Started

1. **Clone the Repository**
   ```sh
   git clone https://github.com/saksham-goel1107/dionysus.git
   cd dionysus
   ```
2. **Install Dependencies**
   ```sh
   npm install
   ```
3. **Run the Development Server**
   ```sh
   npm run dev
   ```
4. **Open in Browser**
   Visit [http://localhost:3000](http://localhost:3000)

---

## 📸 Screenshots

<p align="center">
  <img src="public/undraw_developer.svg" alt="Developer" width="300" />
</p>

---

## 🤝 Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before submitting pull requests.

---

## 📄 License

This project is licensed under the [LICENSE FILE](LICENSE.md).
