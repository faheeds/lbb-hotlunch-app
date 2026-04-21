"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function ParentSignInButtons({ googleEnabled, appleEnabled }: { googleEnabled: boolean; appleEnabled: boolean }) {
  const [message, setMessage] = useState("");

  async function handleSignIn(provider: "google" | "apple", enabled: boolean) {
    if (!enabled) { setMessage(`${provider === "google" ? "Google" : "Apple"} sign-in is not configured yet.`); return; }
    setMessage("");
    await signIn(provider, { callbackUrl: "/account" });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => handleSignIn("google", googleEnabled)}
        disabled={!googleEnabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-ink disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <span>G</span> Continue with Google
      </button>
      <button
        type="button"
        onClick={() => handleSignIn("apple", appleEnabled)}
        disabled={!appleEnabled}
        className="w-full rounded-xl bg-ink px-4 py-3 text-[13px] font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <span>🍎</span> Continue with Apple
      </button>
      {message && <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-900">{message}</p>}
      <p className="text-[11px] text-slate-400 text-center">OAuth credentials must be configured in your environment.</p>
    </div>
  );
}
