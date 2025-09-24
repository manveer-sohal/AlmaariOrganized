"use client";

import { useState } from "react";

export default function Login() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogin = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    window.location.assign("/api/auth/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-300 px-4">
      <div className="bg-white/95 backdrop-blur shadow-xl rounded-2xl p-8 sm:p-10 w-full max-w-md border border-indigo-50">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
            {/* Wardrobe/lock style icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="text-indigo-600"
            >
              <path
                d="M7 10V7a5 5 0 1 1 10 0v3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="4"
                y="10"
                width="16"
                height="10"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="15" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-center text-indigo-700">
            Welcome back to Almaari
          </h1>
          <p className="text-center text-gray-600 max-w-sm">
            Sign in to access your personalized wardrobe, curated outfits, and
            weather-aware suggestions.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.25 7.25a1 1 0 0 1-1.414 0L3.293 9.207a1 1 0 1 1 1.414-1.414l3.046 3.046 6.543-6.546a1 1 0 0 1 1.411 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <p className="text-sm text-gray-700">
              Secure authentication powered by Auth0
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.25 7.25a1 1 0 0 1-1.414 0L3.293 9.207a1 1 0 1 1 1.414-1.414l3.046 3.046 6.543-6.546a1 1 0 0 1 1.411 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <p className="text-sm text-gray-700">
              Personalized outfit recommendations
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.25 7.25a1 1 0 0 1-1.414 0L3.293 9.207a1 1 0 1 1 1.414-1.414l3.046 3.046 6.543-6.546a1 1 0 0 1 1.411 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <p className="text-sm text-gray-700">
              Weather-aware wardrobe planning
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleLogin}
            disabled={isRedirecting}
            aria-busy={isRedirecting}
            className="w-full bg-indigo-600 text-white font-semibold py-3.5 px-4 rounded-lg shadow hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {isRedirecting ? (
              <span className="inline-flex items-center justify-center gap-2">
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
              <span>Continue with Auth0</span>
            )}
          </button>

          <p className="text-center text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="text-indigo-600 hover:text-indigo-700 underline"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-indigo-600 hover:text-indigo-700 underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
