"use client";

import { useState } from "react";

export default function Login({ type }: { type: "navbar" | "homepage" }) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogin = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    //change url to http://localhost:3000/api/auth/login not http://localhost:3000/home/api/auth/login
    window.location.assign(
      `${window.location.origin}/api/auth/login?returnTo=/dashboard`
    );
  };

  return (
    <>
      {type === "navbar" && (
        <button onClick={handleLogin} className="hover:text-indigo-600">
          Log In
        </button>
      )}
      {type === "homepage" && (
        <button
          onClick={handleLogin}
          disabled={isRedirecting}
          className="inline-flex items-center justify-center gap-2 font-semibold px-5 py-3 rounded-xl border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-80"
        >
          Log In
        </button>
      )}
    </>
  );
}
