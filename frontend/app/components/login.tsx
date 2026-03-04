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
    //change url to http://localhost:3000/api/auth/login not http://localhost:3000/home/api/auth/login
    window.location.assign(
      `${window.location.origin}/api/auth/login?returnTo=/dashboard`,
    );
  };

  //loading animation on the button when redirecting but keep the size of the button
  const loadingAnimation = (
    <div className="inline-flex items-center gap-2 w-full justify-center text-indigo-700">
      <svg
        className="h-4 w-11 animate-spin"
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
    </div>
  );
  return (
    <>
      {type === "navbar" && (
        <button
          onClick={handleLogin}
          className="hover:text-indigo-600 cursor-pointer transition-colors duration-300"
          disabled={isRedirecting}
        >
          {isRedirecting ? (
            <div className="w-full justify-center">{loadingAnimation}</div>
          ) : (
            <span>Log In</span>
          )}
        </button>
      )}
      {type === "homepage" && (
        <button
          onClick={handleLogin}
          disabled={isRedirecting}
          className="inline-flex items-center justify-center gap-2 font-semibold px-5 py-3 rounded-xl border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-80 cursor-pointer"
        >
          {isRedirecting ? (
            <div className="w-full justify-center">{loadingAnimation}</div>
          ) : (
            <span>Log In</span>
          )}
        </button>
      )}
      {type === "settings" && (
        <button onClick={handleLogin} disabled={isRedirecting} className="">
          {isRedirecting ? (
            <div className="w-full justify-center">{loadingAnimation}</div>
          ) : (
            <span>Log In</span>
          )}
        </button>
      )}
    </>
  );
}
