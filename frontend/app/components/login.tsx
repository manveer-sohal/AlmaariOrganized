"use client";

import { useState } from "react";

export default function Login({
  type,
}: {
  type: "navbar" | "homepage" | "settings";
}) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogin = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    window.location.assign(
      `${window.location.origin}/api/auth/login?returnTo=/dashboard`,
    );
  };

  const loadingAnimation = (
    <div className="inline-flex w-full items-center justify-center gap-2 text-almaari-accent">
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
    </div>
  );

  return (
    <>
      {type === "navbar" && (
        <button
          type="button"
          onClick={handleLogin}
          className="min-h-11 cursor-pointer text-sm font-medium text-almaari-muted transition-colors hover:text-almaari-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
          disabled={isRedirecting}
        >
          {isRedirecting ? loadingAnimation : <span>Log in</span>}
        </button>
      )}
      {type === "homepage" && (
        <button
          type="button"
          onClick={handleLogin}
          disabled={isRedirecting}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-almaari border border-almaari-border bg-almaari-surface-raised px-5 py-2.5 text-sm font-semibold text-almaari-ink transition hover:bg-almaari-accent-soft disabled:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
        >
          {isRedirecting ? loadingAnimation : <span>Log in</span>}
        </button>
      )}
      {type === "settings" && (
        <button type="button" onClick={handleLogin} disabled={isRedirecting}>
          {isRedirecting ? loadingAnimation : <span>Log in</span>}
        </button>
      )}
    </>
  );
}
