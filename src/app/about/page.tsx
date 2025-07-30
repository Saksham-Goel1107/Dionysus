'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Navbar } from '../components/navbar';

const randomUserPhotos = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/65.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/12.jpg',
  'https://randomuser.me/api/portraits/women/21.jpg',
];

const testimonials = [
  {
    name: 'Alex Chen',
    role: 'Full Stack Developer',
    text: 'Dionysus has completely changed the way I work with GitHub. The AI suggestions are spot on and save me hours every week!',
    avatar: randomUserPhotos[0],
  },
  {
    name: 'Priya Sharma',
    role: 'Open Source Maintainer',
    text: 'I love how Dionysus helps me onboard contributors and keep my projects healthy. The productivity boost is real.',
    avatar: randomUserPhotos[1],
  },
  {
    name: 'Jordan Lee',
    role: 'AI Enthusiast',
    text: 'The integration with GitHub is seamless and the UI is beautiful. Highly recommended for any developer!',
    avatar: randomUserPhotos[2],
  },
  {
    name: 'Maria Garcia',
    role: 'DevOps Engineer',
    text: 'Dionysus makes CI/CD and code review a breeze. The AI-powered insights are invaluable.',
    avatar: randomUserPhotos[3],
  },
  {
    name: 'Liam Smith',
    role: 'Frontend Architect',
    text: 'I use Dionysus every day. The productivity tools and integrations are top-notch.',
    avatar: randomUserPhotos[4],
  },
  {
    name: 'Ava Patel',
    role: 'Backend Specialist',
    text: 'Security and privacy are critical for us. Dionysus delivers on both fronts.',
    avatar: randomUserPhotos[5],
  },
];

const faqs = [
  {
    q: 'What is Dionysus?',
    a: 'Dionysus is an AI-powered GitHub assistant that helps you code smarter, faster, and more securely. It offers code suggestions, productivity tools, and instant help for developers.',
  },
  {
    q: 'Who created Dionysus?',
    a: 'Dionysus was created by Saksham Goel, a passionate developer and maker focused on AI and developer tools.',
  },
  {
    q: 'Is Dionysus free to use?',
    a: 'Dionysus offers a generous free tier and premium features for power users and teams.',
  },
  {
    q: 'How do I get started?',
    a: 'Just sign in with your GitHub account and start using Dionysus in your projects!',
  },
  {
    q: 'Can I use Dionysus with private repositories?',
    a: 'Yes! Dionysus works with both public and private repositories. Your data is always secure.',
  },
  {
    q: 'Does Dionysus support team collaboration?',
    a: 'Absolutely. Invite your team and collaborate on code, issues, and more with advanced permissions.',
  },
  {
    q: 'How often are new features released?',
    a: 'We ship improvements and new features every month, based on user feedback and the latest in AI research.',
  },
  {
    q: 'How can I contribute?',
    a: 'We love open source! Check out our GitHub repo and join the community.',
  },
];

const partners = [
  { name: 'Vercel', logo: '/about/vercel.png', url: 'https://vercel.com' },
  { name: 'GitHub', logo: '/about/github.png', url: 'https://github.com' },
  { name: 'Gemini', logo: '/about/gemini.png', url: 'https://gemini.google.com' },
  { name: 'Clerk', logo: '/about/clerk.png', url: 'https://clerk.dev' },
  { name: 'Prisma', logo: '/about/prisma.png', url: 'https://prisma.io' },
];

const funFacts = [
  'Dionysus is named after the Greek god of creativity and inspiration.',
  'The first prototype was built in just 48 hours.',
  'Over 10,000+ code suggestions served every week.',
  'The mascot is a friendly AI bot named "Dio".',
];

const stats = [
  { label: 'Developers', value: '12,000+' },
  { label: 'AI Suggestions', value: '1.2M+' },
  { label: 'Integrations', value: '20+' },
  { label: 'Countries', value: '30+' },
];

export default function AboutPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <>
      <Navbar />

      <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 px-4 py-12">
        {/* Hero Section */}
        <section className="mb-16 flex w-full max-w-4xl flex-col items-center text-center">
          <Image
            src="https://avatars.githubusercontent.com/u/175415316?v=4"
            alt="Saksham Goel"
            width={120}
            height={120}
            className="mb-4 rounded-full border-4 border-white shadow-md"
          />
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-white drop-shadow-lg md:text-5xl">
            About Dionysus
          </h1>
          <p className="mb-4 max-w-2xl text-lg text-gray-200 md:text-xl">
            Dionysus is your AI-powered GitHub assistant, helping you code smarter and faster. Get
            instant help, code suggestions, and productivity tools for developers.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-4 md:flex-row">
            <a
              href="https://dionysus-gray.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white shadow transition hover:bg-blue-700"
            >
              Visit Main Site
            </a>
            <a
              href="https://github.com/sakshamgoel1107"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-gray-700 px-6 py-2 font-medium text-white shadow transition hover:bg-gray-800"
            >
              GitHub
            </a>
          </div>
        </section>

        {/* Animated Stats Section */}
        <section className="mb-16 flex w-full max-w-4xl flex-wrap justify-center gap-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex min-w-[120px] flex-col items-center rounded-xl bg-white/10 p-6 shadow"
            >
              <span className="mb-1 animate-pulse text-3xl font-bold text-blue-400">
                {stat.value}
              </span>
              <span className="text-sm uppercase tracking-wider text-gray-200">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* Features Section */}
        <section className="mb-16 w-full max-w-4xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-white">Key Features</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-xl bg-white/10 p-6 shadow">
              <svg
                className="mb-3 h-10 w-10 text-blue-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 20l9-5-9-5-9 5 9 5z" />
                <path d="M12 12V4l9 5-9 5-9-5 9-5z" />
              </svg>
              <h3 className="mb-1 text-lg font-semibold text-white">AI Code Suggestions</h3>
              <p className="text-center text-sm text-gray-300">
                Get instant, context-aware code suggestions and explanations powered by advanced AI
                models.
              </p>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-white/10 p-6 shadow">
              <svg
                className="mb-3 h-10 w-10 text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <h3 className="mb-1 text-lg font-semibold text-white">Productivity Tools</h3>
              <p className="text-center text-sm text-gray-300">
                Automate repetitive tasks, manage issues, and boost your workflow with powerful
                integrations.
              </p>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-white/10 p-6 shadow">
              <svg
                className="mb-3 h-10 w-10 text-yellow-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <h3 className="mb-1 text-lg font-semibold text-white">Secure & Private</h3>
              <p className="text-center text-sm text-gray-300">
                Your code and data stay private. Dionysus is built with security and privacy as top
                priorities.
              </p>
            </div>
          </div>
        </section>

        {/*Tech Stack Section */}
        <section className="mb-16 w-full max-w-4xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-white">Tech Stack</h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {partners.map((partner, i) => (
              <a
                key={i}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center rounded-xl bg-white/10 p-6 shadow transition hover:bg-white/20"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={48}
                  height={48}
                  className="mb-2"
                />
                <span className="text-base font-semibold text-gray-200">{partner.name}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Fun Facts Section */}
        <section className="mb-16 w-full max-w-4xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-white">Fun Facts</h2>
          <ul className="list-inside list-disc space-y-2 text-gray-300">
            {funFacts.map((fact, i) => (
              <li key={i} className="flex items-center">
                <span className="mr-2 text-blue-400">•</span>
                {fact}
              </li>
            ))}
          </ul>
        </section>

        {/* Open Source Projects Section */}
        <section className="mb-16 w-full max-w-4xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-white">Open Source Projects</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <a
              href="https://github.com/sakshamgoel1107/dionysus"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col rounded-xl bg-white/10 p-6 shadow transition hover:bg-white/20"
            >
              <span className="mb-2 font-bold text-blue-400">Dionysus</span>
              <p className="mb-2 text-sm text-gray-300">
                The main AI GitHub assistant project. Open source and community-driven.
              </p>
              <span className="text-xs text-gray-400">TypeScript, Next.js, AI</span>
            </a>
            <a
              href="https://github.com/sakshamgoel1107/ai-copilot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col rounded-xl bg-white/10 p-6 shadow transition hover:bg-white/20"
            >
              <span className="mb-2 font-bold text-green-400">AI Copilot</span>
              <p className="mb-2 text-sm text-gray-300">
                A toolkit for building your own AI-powered developer tools.
              </p>
              <span className="text-xs text-gray-400">Node.js, AI, CLI</span>
            </a>
            <a
              href="https://github.com/sakshamgoel1107/oss-starter"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col rounded-xl bg-white/10 p-6 shadow transition hover:bg-white/20"
            >
              <span className="mb-2 font-bold text-yellow-400">OSS Starter</span>
              <p className="mb-2 text-sm text-gray-300">
                A starter kit for open source SaaS projects with best practices.
              </p>
              <span className="text-xs text-gray-400">SaaS, OSS, Boilerplate</span>
            </a>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="mb-16 w-full max-w-4xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-white">What Developers Say</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="flex flex-col items-center rounded-xl bg-white/10 p-6 shadow">
                <Image
                  src={t.avatar ?? '/about/default-avatar.svg'}
                  alt={t.name}
                  width={56}
                  height={56}
                  className="mb-3 rounded-full border-2 border-white"
                  unoptimized
                />
                <p className="mb-2 text-sm text-gray-200">&quot;{t.text}&quot;</p>
                <span className="text-sm font-semibold text-white">{t.name}</span>
                <span className="text-xs text-gray-400">{t.role}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16 w-full max-w-4xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-lg bg-white/10 p-4">
                <button
                  className="flex w-full items-center justify-between text-left text-lg font-medium text-white focus:outline-none"
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                >
                  {faq.q}
                  <span className="ml-2 text-blue-400">{openFAQ === idx ? '-' : '+'}</span>
                </button>
                {openFAQ === idx && <p className="mt-2 text-base text-gray-200">{faq.a}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* About the Maker Section */}
        <section className="mb-16 flex w-full max-w-4xl flex-col items-center gap-8 md:flex-row">
          <div className="flex flex-1 flex-col items-center md:items-start">
            <Image
              src="https://avatars.githubusercontent.com/u/175415316?v=4"
              alt="Saksham Goel"
              width={100}
              height={100}
              className="mb-4 rounded-full border-4 border-white shadow-md"
            />
            <h2 className="mb-1 text-2xl font-bold text-white">Saksham Goel</h2>
            <p className="mb-2 text-base text-gray-300">Maker of Dionysus</p>
            <p className="max-w-md text-sm text-gray-400">
              Hi! I&apos;m Saksham, a developer passionate about building tools that empower other
              developers. I love AI, open source, and creating products that make a difference.
              Always learning, always shipping.
            </p>
            <div className="mt-4 flex gap-4">
              <a
                href="https://github.com/sakshamgoel1107"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                GitHub
              </a>
              <a href="mailto:sakshamgoel1107@gmail.com" className="text-blue-400 hover:underline">
                Email
              </a>
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center md:items-end">
            <div className="w-full max-w-sm rounded-xl bg-white/10 p-6 shadow">
              <h3 className="mb-2 text-lg font-semibold text-white">Contact</h3>
              <p className="mb-2 text-sm text-gray-300">
                Want to collaborate or have feedback? Reach out anytime!
              </p>
              <a
                href="mailto:sakshamgoel1107@gmail.com"
                className="mt-2 block w-full rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white shadow transition hover:bg-blue-700"
              >
                Email Me
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 w-full max-w-4xl border-t border-white/10 py-8 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Dionysus by Saksham Goel. All rights reserved.
        </footer>
      </main>
    </>
  );
}
