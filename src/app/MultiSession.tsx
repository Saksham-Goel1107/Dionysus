"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "@clerk/nextjs";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const MultisessionAppSupport = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoaded } = useSession();
  const prevSessionId = useRef<string | null>(null);
  const isFirstLoad = useRef(true);
  const wasSignedOut = useRef(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (prevSessionId.current && !session?.id) {
      wasSignedOut.current = true;
    }

    if (isFirstLoad.current || prevSessionId.current === null) {
      prevSessionId.current = session?.id || null;
      isFirstLoad.current = false;
      return;
    }

    if (wasSignedOut.current && session?.id) {
      wasSignedOut.current = false;
      prevSessionId.current = session?.id;
      return;
    }

    if (prevSessionId.current && session?.id && session?.id !== prevSessionId.current) {
      setSwitching(true);
      setTimeout(() => {
        try {
          window.history.back();
          setTimeout(() => window.location.reload(), 300);
        } catch (err) {
          window.location.replace("/dashboard");
        }
      }, 300);
    }
    
    prevSessionId.current = session?.id || null;
  }, [session?.id, isLoaded]);

  if (switching) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column"
      }}>
        <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Switching account…</div>
        <div style={{ fontSize: 16, opacity: 0.7 }}>Please wait</div>
      </div>
    );
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default MultisessionAppSupport;