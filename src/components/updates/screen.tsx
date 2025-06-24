"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function MaintenanceScreen() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4"
            style={{
                background:
                    theme === "dark"
                        ? "linear-gradient(135deg, #232526 0%, #414345 100%)"
                        : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                transition: "background 0.3s",
            }}
        >
            <div className="max-w-md w-full flex flex-col items-center text-center p-8 rounded-2xl shadow-xl"
                style={{
                    background: theme === "dark" ? "rgba(30, 41, 59, 0.85)" : "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(8px)",
                }}
            >
                <svg
                    width={80}
                    height={80}
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mb-6"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke={theme === "dark" ? "#38bdf8" : "#0ea5e9"}
                        strokeWidth="2"
                        fill={theme === "dark" ? "#1e293b" : "#e0f2fe"}
                    />
                    <path
                        d="M8 12h8M12 8v8"
                        stroke={theme === "dark" ? "#38bdf8" : "#0ea5e9"}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
                <h1 className="text-3xl font-bold mb-2 text-sky-600 dark:text-sky-400">
                    We&rsquo;re Updating!
                </h1>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                    Our site is currently undergoing scheduled maintenance.<br />
                    We&rsquo;ll be back shortly with new features and improvements.
                </p>
                <div className="flex gap-2 items-center justify-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        Thank you for your patience.
                    </span>
                </div>
                <button
                    className="mt-6 px-4 py-2 rounded-lg bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-900 font-semibold shadow hover:bg-sky-700 dark:hover:bg-sky-400 transition"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    Switch to {theme === "dark" ? "Light" : "Dark"} Mode
                </button>
            </div>
        </div>
    );
}