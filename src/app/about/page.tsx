"use client"
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
        
		<main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 px-4 py-12">
			{/* Hero Section */}
			<section className="w-full max-w-4xl flex flex-col items-center text-center mb-16">
				<Image
					src="https://avatars.githubusercontent.com/u/175415316?v=4"
					alt="Saksham Goel"
					width={120}
					height={120}
					className="rounded-full border-4 border-white shadow-md mb-4"
				/>
				<h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">
					About Dionysus
				</h1>
				<p className="text-lg md:text-xl text-gray-200 mb-4 max-w-2xl">
					Dionysus is your AI-powered GitHub assistant, helping you code smarter
					and faster. Get instant help, code suggestions, and productivity tools
					for developers.
				</p>
				<div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-4">
					<a
						href="https://dionysus-gray.vercel.app"
						target="_blank"
						rel="noopener noreferrer"
						className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow transition"
					>
						Visit Main Site
					</a>
					<a
						href="https://github.com/sakshamgoel1107"
						target="_blank"
						rel="noopener noreferrer"
						className="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium shadow transition"
					>
						GitHub
					</a>
				</div>
			</section>

			{/* Animated Stats Section */}
			<section className="w-full max-w-4xl mb-16 flex flex-wrap justify-center gap-8">
				{stats.map((stat, i) => (
					<div
						key={i}
						className="flex flex-col items-center bg-white/10 rounded-xl p-6 shadow min-w-[120px]"
					>
						<span className="text-3xl font-bold text-blue-400 mb-1 animate-pulse">
							{stat.value}
						</span>
						<span className="text-gray-200 text-sm uppercase tracking-wider">
							{stat.label}
						</span>
					</div>
				))}
			</section>

			{/* Features Section */}
			<section className="w-full max-w-4xl mb-16">
				<h2 className="text-2xl font-bold text-white mb-6 text-center">
					Key Features
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="bg-white/10 rounded-xl p-6 flex flex-col items-center shadow">
						<svg
							className="w-10 h-10 text-blue-400 mb-3"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							viewBox="0 0 24 24"
						>
							<path d="M12 20l9-5-9-5-9 5 9 5z" />
							<path d="M12 12V4l9 5-9 5-9-5 9-5z" />
						</svg>
						<h3 className="text-lg font-semibold text-white mb-1">
							AI Code Suggestions
						</h3>
						<p className="text-gray-300 text-center text-sm">
							Get instant, context-aware code suggestions and explanations powered
							by advanced AI models.
						</p>
					</div>
					<div className="bg-white/10 rounded-xl p-6 flex flex-col items-center shadow">
						<svg
							className="w-10 h-10 text-green-400 mb-3"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							viewBox="0 0 24 24"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M12 6v6l4 2" />
						</svg>
						<h3 className="text-lg font-semibold text-white mb-1">
							Productivity Tools
						</h3>
						<p className="text-gray-300 text-center text-sm">
							Automate repetitive tasks, manage issues, and boost your workflow
							with powerful integrations.
						</p>
					</div>
					<div className="bg-white/10 rounded-xl p-6 flex flex-col items-center shadow">
						<svg
							className="w-10 h-10 text-yellow-400 mb-3"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							viewBox="0 0 24 24"
						>
							<path d="M9 12l2 2 4-4" />
							<circle cx="12" cy="12" r="10" />
						</svg>
						<h3 className="text-lg font-semibold text-white mb-1">
							Secure & Private
						</h3>
						<p className="text-gray-300 text-center text-sm">
							Your code and data stay private. Dionysus is built with security and
							privacy as top priorities.
						</p>
					</div>
				</div>
			</section>

			
			{/*Tech Stack Section */}
			<section className="w-full max-w-4xl mb-16">
				<h2 className="text-2xl font-bold text-white mb-6 text-center">
					Tech Stack
				</h2>
				<div className="flex flex-wrap justify-center gap-8 items-center">
					{partners.map((partner, i) => (
						<a
							key={i}
							href={partner.url}
							target="_blank"
							rel="noopener noreferrer"
							className="bg-white/10 rounded-xl p-6 shadow flex flex-col items-center hover:bg-white/20 transition"
						>
							<Image
								src={partner.logo}
								alt={partner.name}
								width={48}
								height={48}
								className="mb-2"
							/>
							<span className="text-gray-200 text-base font-semibold">
								{partner.name}
							</span>
						</a>
					))}
				</div>
			</section>

			{/* Fun Facts Section */}
			<section className="w-full max-w-4xl mb-16">
				<h2 className="text-2xl font-bold text-white mb-6 text-center">
					Fun Facts
				</h2>
				<ul className="list-disc list-inside space-y-2 text-gray-300">
					{funFacts.map((fact, i) => (
						<li key={i} className="flex items-center">
							<span className="text-blue-400 mr-2">•</span>
							{fact}
						</li>
					))}
				</ul>
			</section>

			{/* Open Source Projects Section */}
			<section className="w-full max-w-4xl mb-16">
				<h2 className="text-2xl font-bold text-white mb-6 text-center">
					Open Source Projects
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<a
						href="https://github.com/sakshamgoel1107/dionysus"
						target="_blank"
						rel="noopener noreferrer"
						className="bg-white/10 rounded-xl p-6 shadow flex flex-col hover:bg-white/20 transition"
					>
						<span className="text-blue-400 font-bold mb-2">Dionysus</span>
						<p className="text-gray-300 text-sm mb-2">
							The main AI GitHub assistant project. Open source and community-driven.
						</p>
						<span className="text-gray-400 text-xs">
							TypeScript, Next.js, AI
						</span>
					</a>
					<a
						href="https://github.com/sakshamgoel1107/ai-copilot"
						target="_blank"
						rel="noopener noreferrer"
						className="bg-white/10 rounded-xl p-6 shadow flex flex-col hover:bg-white/20 transition"
					>
						<span className="text-green-400 font-bold mb-2">AI Copilot</span>
						<p className="text-gray-300 text-sm mb-2">
							A toolkit for building your own AI-powered developer tools.
						</p>
						<span className="text-gray-400 text-xs">Node.js, AI, CLI</span>
					</a>
					<a
						href="https://github.com/sakshamgoel1107/oss-starter"
						target="_blank"
						rel="noopener noreferrer"
						className="bg-white/10 rounded-xl p-6 shadow flex flex-col hover:bg-white/20 transition"
					>
						<span className="text-yellow-400 font-bold mb-2">OSS Starter</span>
						<p className="text-gray-300 text-sm mb-2">
							A starter kit for open source SaaS projects with best practices.
						</p>
						<span className="text-gray-400 text-xs">SaaS, OSS, Boilerplate</span>
					</a>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="w-full max-w-4xl mb-16">
				<h2 className="text-2xl font-bold text-white mb-6 text-center">
					What Developers Say
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{testimonials.map((t, i) => (
						<div
							key={i}
							className="bg-white/10 rounded-xl p-6 flex flex-col items-center shadow"
						>
							<Image
								src={t.avatar ?? "/default-avatar.png"}
								alt={t.name}
								width={56}
								height={56}
								className="rounded-full mb-3 border-2 border-white"
							/>
							<p className="text-gray-200 text-sm mb-2">&quot;{t.text}&quot;</p>
							<span className="text-white font-semibold text-sm">
								{t.name}
							</span>
							<span className="text-gray-400 text-xs">{t.role}</span>
						</div>
					))}
				</div>
			</section>

			{/* FAQ Section */}
			<section className="w-full max-w-4xl mb-16">
				<h2 className="text-2xl font-bold text-white mb-6 text-center">
					Frequently Asked Questions
				</h2>
				<div className="space-y-4">
					{faqs.map((faq, idx) => (
						<div key={idx} className="bg-white/10 rounded-lg p-4">
							<button
								className="w-full text-left flex justify-between items-center text-white font-medium text-lg focus:outline-none"
								onClick={() =>
									setOpenFAQ(openFAQ === idx ? null : idx)
								}
							>
								{faq.q}
								<span className="ml-2 text-blue-400">
									{openFAQ === idx ? '-' : '+'}
								</span>
							</button>
							{openFAQ === idx && (
								<p className="mt-2 text-gray-200 text-base">{faq.a}</p>
							)}
						</div>
					))}
				</div>
			</section>

			{/* About the Maker Section */}
			<section className="w-full max-w-4xl mb-16 flex flex-col md:flex-row items-center gap-8">
				<div className="flex-1 flex flex-col items-center md:items-start">
					<Image
						src="https://avatars.githubusercontent.com/u/175415316?v=4"
						alt="Saksham Goel"
						width={100}
						height={100}
						className="rounded-full border-4 border-white shadow-md mb-4"
					/>
					<h2 className="text-2xl font-bold text-white mb-1">
						Saksham Goel
					</h2>
					<p className="text-gray-300 text-base mb-2">Maker of Dionysus</p>
					<p className="text-gray-400 text-sm max-w-md">
						Hi! I&apos;m Saksham, a developer passionate about building tools that
						empower other developers. I love AI, open source, and creating
						products that make a difference. Always learning, always shipping.
					</p>
					<div className="flex gap-4 mt-4">
						<a
							href="https://github.com/sakshamgoel1107"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:underline"
						>
							GitHub
						</a>
						<a
							href="mailto:sakshamgoel1107@gmail.com"
							className="text-blue-400 hover:underline"
						>
							Email
						</a>
					</div>
				</div>
				<div className="flex-1 flex flex-col items-center md:items-end">
					<div className="bg-white/10 rounded-xl p-6 shadow w-full max-w-sm">
						<h3 className="text-lg font-semibold text-white mb-2">
							Contact
						</h3>
						<p className="text-gray-300 text-sm mb-2">
							Want to collaborate or have feedback? Reach out anytime!
						</p>
						<a
							href="mailto:sakshamgoel1107@gmail.com"
							className="block w-full text-center mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow transition"
						>
							Email Me
						</a>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="w-full max-w-4xl text-center text-gray-500 text-xs py-8 border-t border-white/10 mt-8">
				&copy; {new Date().getFullYear()} Dionysus by Saksham Goel. All rights
				reserved.
			</footer>
		</main>
        </>
	);
}
