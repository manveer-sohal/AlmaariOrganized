"use client";

import { useState } from "react";

export default function Signup({ type }: { type: "homepage" | "navbar" }) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSignup = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    window.location.assign(
      `${window.location.origin}/api/auth/login?returnTo=/dashboard&screen_hint=signup`,
    );
  };

  return (
    <>
      {type === "navbar" && (
        <button
          type="button"
          onClick={handleSignup}
          className="inline-flex min-h-11 items-center gap-2 rounded-almaari bg-almaari-accent px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-almaari-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
          disabled={isRedirecting}
        >
          Get started
        </button>
      )}
      {type === "homepage" && (
        <button
          type="button"
          onClick={handleSignup}
          disabled={isRedirecting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-almaari bg-almaari-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-almaari-accent-strong disabled:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
        >
          {isRedirecting ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                />
              </svg>
              Redirecting…
            </span>
          ) : (
            <span>Get started — it’s free</span>
          )}
        </button>
      )}
    </>
  );
}
