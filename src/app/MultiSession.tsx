"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "@clerk/nextjs";

const MultisessionAppSupport = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoaded } = useSession();
  const prevSessionId = useRef<string | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (prevSessionId.current && session?.id !== prevSessionId.current) {
      setSwitching(true);
      setTimeout(() => {
        window.history.back();
        setTimeout(() => window.location.reload(), 300);
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

  return <React.Fragment key={session ? session.id : "no-users"}>{children}</React.Fragment>;
};

export default MultisessionAppSupport;