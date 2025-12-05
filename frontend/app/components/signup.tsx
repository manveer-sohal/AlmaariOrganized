"use client";
import { useState } from "react";
export default function Signup({ type }: { type: "homepage" | "navbar" }) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSignup = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    window.location.assign(
      `${window.location.origin}/api/auth/login?returnTo=/dashboard&screen_hint=signup`
    );
  };

  return (
    <>
      {type === "navbar" && (
        <button
          onClick={handleSignup}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
          disabled={isRedirecting}
        >
          Try Free
        </button>
      )}
      {type === "homepage" && (
        <button
          onClick={handleSignup}
          disabled={isRedirecting}
          className="inline-flex items-center justify-center gap-2 font-semibold px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-80"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                ></path>
              </svg>
              Redirecting…
            </span>
          ) : (
            <span>Get Started - It’s Free!</span>
          )}
        </button>
      )}
    </>
  );
}
