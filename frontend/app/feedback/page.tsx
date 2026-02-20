"use client";

import { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";

type FeedbackType = "bug" | "feature" | "improvement" | "other";
type FeedbackPriority = "low" | "medium" | "high";

export default function FeedbackPage() {
  const { user } = useUser();
  const [type, setType] = useState<FeedbackType>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<FeedbackPriority>("medium");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          subject: subject.trim(),
          message: message.trim(),
          priority,
          email: user?.email ?? undefined,
          userId: user?.sub ?? undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "Failed to send feedback");
      }

      setSubmitted(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-1 backdrop-blur-sm min-h-screen w-full h-full md:min-h-[80vh] flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl w-full max-w-xl mx-auto p-6 shadow-md text-base flex flex-col gap-4">
          <p className="text-indigo-900 font-medium text-center">
            Thanks for your feedback. We&apos;ve passed it along to the
            developers.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 backdrop-blur-sm min-h-screen w-full h-full md:min-h-[80vh] sticky sm:h-full">
      <form
        onSubmit={handleSubmit}
        className="md:mt-5 mt-2 bg-white/80 backdrop-blur border border-indigo-200 rounded-xl w-full max-w-xl mx-auto p-6 shadow-md text-base flex flex-col md:gap-4 sm:gap-2 gap-1"
      >
        <div className="w-full mx-auto mb-1 flex justify-start">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300"
          >
            ← Back
          </Link>
        </div>

        <h1 className="text-lg font-semibold text-indigo-900">
          Send feedback to developers
        </h1>

        <label
          htmlFor="feedback-type"
          className="text-sm font-medium text-indigo-900"
        >
          Type
        </label>
        <select
          id="feedback-type"
          value={type}
          onChange={(e) => setType(e.target.value as FeedbackType)}
          className="rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="bug">Bug</option>
          <option value="feature">Feature request</option>
          <option value="improvement">Improvement</option>
          <option value="other">Other</option>
        </select>

        <label
          htmlFor="feedback-subject"
          className="text-sm font-medium text-indigo-900"
        >
          Subject
        </label>
        <input
          id="feedback-subject"
          type="text"
          placeholder="Short summary of your feedback"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        <label
          htmlFor="feedback-message"
          className="text-sm font-medium text-indigo-900"
        >
          Message
        </label>
        <textarea
          id="feedback-message"
          placeholder="Describe your feedback in detail..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y min-h-[100px]"
        />

        <label
          htmlFor="feedback-priority"
          className="text-sm font-medium text-indigo-900"
        >
          Priority
        </label>
        <select
          id="feedback-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
          className="rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {user?.email && (
          <p className="text-xs text-indigo-700">
            Submitting as <span className="font-medium">{user.email}</span>
          </p>
        )}

        {error && <span className="text-sm text-red-600">{error}</span>}

        <div className="mt-2 flex items-center gap-2">
          {loading ? (
            <div className="inline-flex items-center justify-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700">
              Sending...
            </div>
          ) : (
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
            >
              Submit feedback
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
