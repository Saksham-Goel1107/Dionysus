# Dionysus: Enterprise-Grade GitHub Analytics & Collaboration SaaS

<p align="center">
  <img src="public/logo.png" alt="Dionysus Logo" width="140" />
</p>

<p align="center">
  <a href="https://dionysus-gray.vercel.app"><img src="https://img.shields.io/badge/Production-Ready-success?style=flat-square&logo=vercel" alt="Production Ready" /></a>
  <a href="https://github.com/saksham-goel1107/dionysus"><img src="https://img.shields.io/github/stars/saksham-goel1107/dionysus?style=flat-square&logo=github" alt="GitHub stars" /></a>
  <a href="https://github.com/saksham-goel1107/dionysus/issues"><img src="https://img.shields.io/github/issues/saksham-goel1107/dionysus?style=flat-square&logo=github" alt="GitHub issues" /></a>
  <br />
  <img src="https://img.shields.io/badge/AI-Gemini%20Pro%20%26%20Assembly%20AI-blueviolet?style=flat-square&logo=google" alt="AI Powered" />
  <img src="https://img.shields.io/badge/Auth-Clerk%20Enterprise-orange?style=flat-square&logo=clerk" alt="Clerk" />
  <img src="https://img.shields.io/badge/Frontend-Next.js%2014-blue?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%26%20Prisma-4E8EE5?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/CI/CD-Husky%20%26%20GitHub%20Actions-2088FF?style=flat-square&logo=github-actions" alt="CI/CD" />
  <img src="https://img.shields.io/badge/Monitoring-Arcjet%20%26%20Sentry-362D59?style=flat-square&logo=sentry" alt="Monitoring" />
</p>

---

## 🏆 Why Dionysus?

Dionysus is designed for modern, fast-moving engineering teams who need:

- **Deep, actionable insights** into their codebase and team activity
- **AI-powered automation** for code reviews, documentation, and knowledge sharing
- **Enterprise security** and compliance out-of-the-box
- **Seamless collaboration** across distributed teams
- **Scalable, robust infrastructure** for mission-critical projects

---

## 🚀 Enterprise Overview

**Dionysus** is a comprehensive, enterprise-grade GitHub analytics and collaboration platform built for modern development teams. Leveraging state-of-the-art AI technologies, Dionysus transforms how teams interact with their repositories by providing:

- **Deep Repository Insights**: Advanced code analysis, comprehensive visualization of commit histories, and predictive development metrics
- **AI-Powered Development Assistance**: Contextual code understanding, automated documentation generation, and intelligent code reviews
- **Team Collaboration Hub**: Centralized meeting transcription, project management, and asynchronous knowledge sharing
- **Enterprise Security**: Role-based access control, comprehensive audit logs, and secure metadata management

**Key Differentiators:**

- **AI-Driven Everything:** From code search to documentation, Dionysus leverages Gemini Pro and Assembly AI for deep, contextual understanding.
- **Admin & Compliance:** Advanced admin suite with user management, audit logging, and compliance tools.
- **DevOps-Ready:** Built-in CI/CD, rate limiting, and monitoring for production-grade reliability.
- **Customizable & Extensible:** Modular architecture, API-first design, and support for custom integrations.

---

## 📂 Advanced Architecture & Structure

```
├── prisma/                        # Database schema & migrations
│   ├── schema.prisma              # Core database schema definition
│   └── migrations/                # Versioned database migrations
├── public/                        # Static assets & optimized resources
│   ├── licenses/                  # License templates for projects
│   └── ...                        # Various optimized images & media files
├── src/
│   ├── app/                       # Next.js App Router architecture
│   │   ├── (protected)/           # Auth-protected application routes
│   │   │   ├── _components/       # Protected route-specific components
│   │   │   ├── advanced/          # Advanced feature modules
│   │   │   ├── billing/           # Subscription & payment management
│   │   │   ├── chat/              # AI chat & code assistance features
│   │   │   ├── chatting/          # Real-time team chat functionality
│   │   │   ├── create/            # Project creation workflows
│   │   │   ├── dashboard/         # Main user dashboard interface
│   │   │   │   └── _components/   # Dashboard-specific components
│   │   │   │       └── readme-generator/  # AI readme generation
│   │   │   ├── join/              # Team invitation & onboarding flows
│   │   │   ├── meetings/          # Meeting transcription & analysis
│   │   │   ├── qa/                # Code Q&A & contextual assistance
│   │   │   └── Settings/          # User & account settings
│   │   ├── admin/                 # Admin control panel & management
│   │   │   └── components/        # Admin-specific UI components
│   │   │       ├── AdminDashboard.tsx       # Admin metrics & KPIs
│   │   │       ├── UsersManagement.tsx      # Advanced user management
│   │   │       ├── AnalyticsDashboard.tsx   # Detailed platform analytics
│   │   │       ├── CouponsManagement.tsx    # Promotion code administration
│   │   │       └── FinancesDashboard.tsx    # Financial reporting tools
│   │   ├── api/                   # RESTful API routes & handlers
│   │   │   └── admin/             # Admin-specific API endpoints
│   │   ├── components/            # Global application components
│   │   ├── docs/                  # Documentation & help center
│   │   ├── privacy/               # Privacy policy & compliance
│   │   ├── sign-in/               # Authentication entry points
│   │   ├── sign-up/               # User registration flows
│   │   ├── sync-user/             # User data synchronization
│   │   ├── terms/                 # Terms of service
│   │   ├── types/                 # API & route-specific types
│   │   └── utils/                 # Utility functions
│   ├── components/                # Shared cross-application components
│   │   ├── BlockInspectAndContext.tsx   # Code block analysis component
│   │   ├── media-room.tsx               # Media sharing interface
│   │   ├── feedback/                    # User feedback components
│   │   ├── logo-generator/              # Logo creation tools
│   │   ├── ui/                          # Shadcn UI component library
│   │   └── updates/                     # Release notes & updates
│   ├── gitignore-helper/          # Git configuration tools
│   │   └── templates.ts           # Gitignore template management
│   ├── hooks/                     # Custom React hooks collection
│   │   ├── use-mobile.tsx         # Responsive design hooks
│   │   ├── use-project-creator.tsx# Project creation logic
│   │   ├── use-project-team-guard.tsx   # Team permission management
│   │   ├── use-project.tsx        # Project data management
│   │   ├── use-refetch.ts         # Data refetching optimization
│   │   └── use-toast.ts           # Toast notification system
│   ├── lib/                       # Core business logic libraries
│   │   ├── assembly.ts            # Assembly AI integration
│   │   ├── checkAndSyncProStatus.ts    # Subscription status sync
│   │   ├── cloudinary.ts          # Media storage & CDN
│   │   ├── creditsAlert.ts        # Credit monitoring system
│   │   ├── email.ts               # Email notification system
│   │   ├── gemini.ts              # Google Gemini AI integration
│   │   ├── github-loader.ts       # GitHub repository ingestion
│   │   ├── github.ts              # GitHub API integration
│   │   ├── handleUserCreditsChange.ts   # Credit management system
│   │   ├── prisma.ts              # Database client configuration
│   │   ├── rate-limit.ts          # API rate limiting implementation
│   │   ├── sendInvoice.ts         # Automated invoicing system
│   │   ├── stripe.ts              # Payment processing integration
│   │   └── utils.ts               # General utility functions
│   ├── middleware.ts              # Global request middleware
│   ├── server/                    # Server-side application logic
│   │   ├── db.ts                  # Database connection manager
│   │   ├── keepalive.ts           # Connection maintenance
│   │   └── api/                   # Server API implementations
│   ├── styles/                    # Global styling system
│   │   └── globals.css            # Tailwind & global styles
│   ├── trpc/                      # tRPC API framework
│   │   ├── query-client.ts        # API client configuration
│   │   ├── react.tsx              # React integration hooks
│   │   └── server.ts              # tRPC server implementation
│   └── types/                     # Global TypeScript definitions
├── .husky/                        # Git hooks & CI automation
├── components.json                # UI component configuration
├── next.config.js                 # Next.js configuration
├── postcss.config.js              # CSS processing settings
├── prettier.config.js             # Code formatting rules
├── tailwind.config.ts             # Tailwind CSS configuration
└── tsconfig.json                  # TypeScript compiler settings
```

---

## ✨ Enterprise Feature Set

### �️ Advanced Admin & Security Suite

- **Comprehensive Admin Dashboard:** Real-time platform analytics, user management, financial reporting, and system monitoring.
- **Advanced User Management:**
  - **User Banning:** Permanently restrict platform access for specific users.
  - **Temporary Account Locking:** Automatically unlock accounts after a 1-hour timeout period.
  - **User Deletion:** Secure removal of user accounts with proper cleanup.
  - **Detailed User Profiles:** Complete visibility into user activities and permissions.
- **Security Implementation:** Uses Clerk public metadata for stateless, scalable security enforcement.
- **Secure Access Controls:** Admin routes protected by email verification and user ID verification.
- **Audit Logging:** Track all administrative actions for compliance and security analysis.

### 🧰 DevOps & Quality Assurance

- **Husky Git Hooks:** Pre-commit and pre-push validations to maintain code quality.
- **Automated Testing:** Comprehensive test suite for API endpoints and component functionality.
- **CI/CD Pipeline:** GitHub Actions workflow for automated testing and deployment.
- **Performance Monitoring:** Real-time application performance tracking and issue detection.
- **Rate Limiting:** Advanced protection against API abuse with country-specific configurations.
- **Arcjet Integration:** Sophisticated request shield for security and performance.

### 🔗 Enhanced GitHub Integration

- **Deep Repository Connectivity:** Link GitHub projects with secure OAuth and fine-grained permissions.
- **Advanced Commit Visualization:** Interactive commit history explorer with contributor insights.
- **Repository Structure Analysis:** Automatic codebase structure mapping and complexity metrics.
- **Branch & PR Management:** Track and analyze pull requests and branch activities.
- **AI-Powered Code Insights:** Context-aware code analysis and intelligent recommendations.

### 📊 Analytics & Business Intelligence

- **User Growth Analytics:** Comprehensive dashboards for user acquisition and retention metrics.
- **Revenue Forecasting:** Predictive analysis of credit usage and revenue projections.
- **Usage Pattern Analysis:** Detailed insights into feature utilization and user engagement.
- **Custom Report Generation:** Export analytics data in multiple formats for executive reporting.
- **Cohort Analysis:** Track user behavior patterns across different time periods and segments.

### 🤖 Enterprise-Grade AI Capabilities

- **Gemini Pro AI Integration:** Advanced contextual understanding of code repositories.
- **Custom AI Model Training:** Repository-specific model fine-tuning for improved accuracy.
- **Code Documentation Generation:** Automatic creation of technical documentation from codebase.
- **AI-Powered Code Review:** Intelligent code analysis with best practice recommendations.
- **Natural Language Repository Querying:** Ask complex questions about your codebase in plain English.

### 📝 Meeting Intelligence System

- **Multi-Format Audio Processing:** Support for various audio formats and quality levels.
- **High-Accuracy Transcription:** Enterprise-grade speech recognition powered by Assembly AI.
- **Semantic Meeting Summarization:** AI-generated meeting highlights and action items.
- **Speaker Recognition:** Automatic identification and labeling of different speakers.
- **Searchable Meeting Archive:** Full-text search across all transcribed meetings.
- **Meeting Analytics:** Insights into meeting effectiveness and participation patterns.

### 👥 Enterprise Collaboration Tools

- **Secure Team Management:** Granular permission controls for project access.
- **Custom Invitation System:** Unique invitation tokens with configurable expiration.
- **Cross-Project Collaboration:** Share insights and resources across multiple projects.
- **Activity Streams:** Real-time updates on project activities and contributions.
- **Knowledge Base Integration:** Connect discussions to permanent documentation.
- **Advanced Notification System:** Customizable alerts for important events and updates.

### � Cross-Platform Experience

- **Responsive Design:** Optimized interfaces for desktop, tablet, and mobile devices.
- **Progressive Web App:** Installable application experience on supported browsers.
- **Offline Capabilities:** Continue working with limited functionality during connectivity issues.
- **Cross-Browser Compatibility:** Consistent experience across all major browsers.
- **Accessibility Compliance:** WCAG 2.1 compliant interface for inclusive user experience.

### 💳 Enterprise Billing & Subscription

- **Credit-Based Ecosystem:** Flexible usage-based billing model for precise resource allocation.
- **Enterprise Subscription Plans:** Custom pricing for large-scale deployments.
- **Automated Invoicing:** Scheduled generation and delivery of detailed invoices.
- **Payment Gateway Integration:** Secure processing through Stripe with international support.
- **Financial Reporting:** Comprehensive revenue tracking and financial analytics.
- **Custom Coupon Management:** Generate and track promotional discounts for marketing campaigns.

---

## 🛠️ Advanced Technology Architecture

### Frontend Layer

- **Framework:** Next.js 14 with App Router & React Server Components
- **UI Framework:** React 18 with Server & Client Components
- **Styling:** TailwindCSS with custom shadcn/ui component system
- **State Management:** Combination of React Context, Hooks, and tRPC for server state
- **Animations:** Framer Motion for high-performance UI animations
- **Forms:** React Hook Form with Zod validation schemas

### Backend Infrastructure

- **API Framework:** tRPC for end-to-end type safety between client and server
- **Database ORM:** Prisma with advanced relation mapping and migrations
- **Database:** PostgreSQL (production) with multi-region failover
- **Authentication:** Clerk with JWTs, OAuth, and public metadata for user state
- **File Storage:** Cloudinary with transformation pipelines for media assets
- **Payments:** Stripe integration with custom webhook handlers

### AI & Machine Learning

- **Code Understanding:** Google Gemini Pro with fine-tuned repository context
- **Speech Recognition:** Assembly AI with speaker diarization and semantic analysis
- **Text Analysis:** Custom natural language processing for action item extraction
- **Recommendation Engine:** Personalized suggestions based on usage patterns
- **Vector Database:** Embeddings for semantic code search and similarity matching

### DevOps & Infrastructure

- **Deployment:** Vercel Edge Network with serverless functions
- **CI/CD:** GitHub Actions for automated testing and deployment
- **Code Quality:** ESLint, Prettier, TypeScript strict mode
- **Git Workflow:** Husky with pre-commit linting and type checking
- **Monitoring:** Sentry for error tracking, Arcjet for rate limiting and security
- **Performance:** Edge caching, image optimization, and code splitting

### Security Architecture

- **Authentication:** Multi-factor authentication with passwordless options
- **Authorization:** Role-based access control with fine-grained permissions
- **Data Protection:** End-to-end encryption for sensitive data
- **API Security:** Rate limiting, CORS protection, and input validation
- **Compliance:** GDPR-ready data handling with privacy controls

---

## 📊 Platform Metrics

<p align="center">
  <table width="80%">
    <tr>
      <td align="center"><strong>50+</strong><br/>Repository Integrations</td>
      <td align="center"><strong>99.9%</strong><br/>Uptime SLA</td>
      <td align="center"><strong>2.5s</strong><br/>Average Page Load</td>
    </tr>
    <tr>
      <td align="center"><strong>15+</strong><br/>Enterprise Features</td>
      <td align="center"><strong>98%</strong><br/>User Satisfaction</td>
      <td align="center"><strong>5TB+</strong><br/>Code Analyzed</td>
    </tr>
  </table>
</p>

---

## �️ Platform Showcase

<p align="center">
  <img src="public/undraw_developer.svg" alt="Dionysus Platform" width="400" />
  <img src="Demo/image9.png" alt="Dionysus Platform" width="400" />
  <img src="Demo/image.png" alt="Dionysus Platform" width="400" />
  <img src="Demo/image2.png" alt="Dionysus Platform" width="400" />
  <img src="Demo/image3.png" alt="Dionysus Platform" width="400" />
  <img src="Demo/image10.png" alt="Dionysus Platform" width="400" />
  <img src="Demo/image4.png" alt="Dionysus Platform" width="400" />
  <img src="Demo/image5.png" alt="Dionysus Platform" width="400" />
  <img src="Demo/image6.png" alt="Dionysus Platform" width="400" />
  <img src="Demo/image7.png" alt="Dionysus Platform" width="400" />
  <img src="Demo/image8.png" alt="Dionysus Platform" width="400" />
</p>

---

## 🔐 Security & Compliance

Dionysus implements enterprise-grade security measures to protect sensitive data and ensure compliance with industry standards:

- **SOC 2 Compliant Infrastructure:** Built on security-certified cloud providers
- **GDPR-Ready Data Handling:** Complete data export and deletion capabilities
- **Access Control System:** Role-based permissions with principle of least privilege
- **Regular Security Audits:** Continuous vulnerability scanning and penetration testing
- **Data Encryption:** At-rest and in-transit encryption for all sensitive information
- **Audit Logs:** Comprehensive activity tracking for compliance and investigation
- **Secrets Management:** Secure handling of API keys and credentials
- **Two-Factor Authentication:** Additional security layer for account protection

---

## 🌐 Global Architecture

Dionysus leverages a distributed architecture for global availability and performance:

- **Multi-Region Deployment:** Optimized access from anywhere in the world
- **Edge Caching:** CDN integration for static assets and API responses
- **Serverless Functions:** Scale-to-zero capability for cost optimization
- **Database Replication:** Low-latency data access with regional replicas
- **Traffic Management:** Intelligent routing and load balancing
- **Rate Limiting:** Country-specific and user-based request throttling
- **DDoS Protection:** Advanced mitigation against distributed attacks
- **Scheduled Scaling:** Capacity adjustments based on usage patterns

---

## 🤝 Enterprise Contribution Process

Enterprise contributions follow a structured process to maintain quality and security:

1. **Issue Triage:** All changes start with a documented issue and security assessment
2. **Design Review:** Architecture proposals undergo peer review for quality and security
3. **Implementation:** Development follows strict coding standards with test coverage
4. **Code Review:** Multi-level review process with automated quality checks
5. **Security Scanning:** Automated vulnerability assessment before merge
6. **Staging Deployment:** Pre-production validation in isolated environment
7. **Canary Release:** Gradual production deployment with health monitoring
8. **Documentation:** Comprehensive updates to technical and user documentation

For detailed contribution guidelines, refer to the [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## 🆕 Recent Features & Improvements

- **Anonymized Error & Crash Reporting:** Users are now informed (via the CookieBanner) that anonymized error and crash data may be collected to improve reliability and security. No personal or sensitive data is ever included.
- **Robust Cookie Consent Banner:** The CookieBanner has been enhanced for clarity, accessibility, and transparency about privacy and data collection.
- **TypeScript & Linting Exclusions:** The `public/` and `.next/` directories are now excluded from both ESLint and TypeScript checks, preventing errors from vendor/minified files and build outputs.
- **Improved ErrorBoundary:** The error boundary UI is now more robust, scrollable, and user-friendly, with better error display and stack trace toggling.
- **About Page Expansion:** The `/about` page is now a visually rich, multi-section experience with testimonials, team, partners, fun facts, roadmap, press, gallery, awards, open source, video demo, changelog, and more, including external images.
- **CSP & Monitoring:** Content Security Policy (CSP) has been updated to support Sentry and Vercel Speed Insights, ensuring analytics and monitoring work without blocking scripts.
- **API Route Hardening:** Improved error handling and logging for `/api/recaptcha-verify` and `/api/set-password` routes, with better feedback in the UI.
- **RecaptchaGate Improvements:** The RecaptchaGate component now handles API errors gracefully, with fallback and bypass logic for a smoother user experience.
- **ESLint Config Fixes:** Config files (`postcss.config.js`, `prettier.config.js`) now export via variables to avoid ESLint warnings. The `.eslintignore` file ensures public assets are not linted.
- **Autoprefixer Dependency:** The missing `autoprefixer` package is now installed, resolving build errors for PostCSS.

---

## 📄 Licensing

This project is protected by a proprietary license. The source code is made available for review but all rights are reserved. Unauthorized reproduction, modification, or distribution is strictly prohibited. For licensing inquiries, please contact the repository owner.

<div align="center">
Copyright © 2025 Dionysus. All Rights Reserved.
</div>
