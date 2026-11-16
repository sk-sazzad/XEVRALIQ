"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/inbox");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070D2A] relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-purple-700/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/orbit-x.png"
            alt="XEVRALIQ"
            className="w-24 h-24 rounded-2xl object-cover mb-4 shadow-xl shadow-indigo-900/60"
          />
          <h1 className="text-2xl font-bold text-white tracking-widest">XEVRALIQ</h1>
          <p className="text-xs text-white/40 mt-1 tracking-widest uppercase">
            Unified Inbox &amp; Business Operations
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          <h2 className="text-lg font-semibold text-white mb-1">Welcome Back!</h2>
          <p className="text-sm text-white/50 mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-white/8 border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-white/8 border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-opacity tracking-wide"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/25 mt-6 tracking-wider">
          XEVRALIQ — Unified Inbox &amp; Business Operations
        </p>
      </div>
    </div>
  );
}
