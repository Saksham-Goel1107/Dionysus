"use client"
import { Protect } from "@clerk/nextjs";
import { Lock } from "lucide-react";
import React from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import StressTester from "./stress";

const Advanced = () => {
    const {resolvedTheme} = useTheme()
  return (
    <>
      <Protect plan="dionysus_advance_pack" fallback={<div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <Lock className="h-8 w-8 text-yellow-600" />
            </div>
            <h2
              className={`text-center text-2xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-800"}`}
            >
              Advance Plan Required
            </h2>
            <p
              className={`text-center ${resolvedTheme === "dark" ? "text-gray-200" : "text-gray-600"} max-w-md`}
            >
              Access to Advanced Tab is available exclusively for{" "}
              <span className="font-semibold text-yellow-700">
                Dionysus Advance Pack
              </span>{" "}
              subscribers.
              <br />
              Upgrade your plan to unlock this feature.
            </p>
            <Link href="/subscriptions">
              <Button
                size="lg"
                className="mt-2 bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Upgrade Now
              </Button>
            </Link>
          </div>}>
        <div>
            <StressTester/>
        </div>
      </Protect>
    </>
  );
};

export default Advanced;
