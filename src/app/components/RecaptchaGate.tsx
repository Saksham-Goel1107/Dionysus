"use client";
import { useEffect, useState, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RecaptchaGate({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const verifyToken = async () => {
    // @ts-ignore
    if (!window.grecaptcha || !SITE_KEY) {
      setError("reCAPTCHA not properly initialized.");
      return;
    }

    try {
      // @ts-ignore
      const token = await window.grecaptcha.execute(SITE_KEY, { action: "verify" });
      const res = await fetch("/api/recaptcha-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!data.success) {
      setError("reCAPTCHA verification failed. Bot-like activity detected.");
      } else {
      setError(""); 
      }
    } catch {
      setError("Network error during reCAPTCHA verification.");
    }
  };

  useEffect(() => {
    if (!SITE_KEY) {
      setError("reCAPTCHA site key not set");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.grecaptcha) {
        // @ts-ignore
        window.grecaptcha.ready(() => {
          verifyToken(); // Initial check
          intervalRef.current = setInterval(verifyToken, 30_000);
        });
      } else {
        setError("reCAPTCHA failed to load");
      }
    };
    script.onerror = () => {
      setError("Failed to load reCAPTCHA script.");
    };
    document.body.appendChild(script);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      {children}
      {error && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "100vw",
          backgroundColor: "rgba(15, 15, 15, 0.95)",
          color: "#f33",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          fontFamily: "sans-serif",
          textAlign: "center",
          padding: "2rem"
        }}>
          <h1 style={{ fontSize: "2rem" }}>⚠️ Access Blocked</h1>
          <p>{error}</p>
        </div>
      )}
    </>
  );
}
