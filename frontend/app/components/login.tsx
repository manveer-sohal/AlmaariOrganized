"use client";

import Link from "next/link";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-300">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-sm w-full">
        <h2 className="text-3xl font-semibold text-center text-indigo-600 mb-6">
          Welcome Back!
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Log in to access your personalized wardrobe.
        </p>

        {/* Centering the button */}
        <div className="flex justify-center">
          <Link
            href="/api/auth/login"
            className="w-3/4 bg-indigo-500 text-white text-center font-semibold py-3 px-4 rounded-lg hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          >
            Log In with Auth0
          </Link>
        </div>
      </div>
    </div>
  );
}
