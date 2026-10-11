"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090f] px-4 text-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#13131d] p-8 shadow-2xl"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold">เข้าสู่ระบบ</h1>
          <p className="mt-2 text-sm text-gray-400">
            Data Management System
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm text-gray-300">
            อีเมล
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple-500"
            placeholder="กรอกอีเมลของคุณ"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm text-gray-300">
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple-500"
            placeholder="กรอกรหัสผ่าน"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-950/50 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold transition hover:bg-purple-500 disabled:opacity-50"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <p className="text-center text-sm text-gray-400">
          ยังไม่มีบัญชี?{" "}
          <a href="/register" className="text-purple-400 hover:underline">
            สมัครสมาชิก
          </a>
        </p>
      </form>
    </main>
  );
}