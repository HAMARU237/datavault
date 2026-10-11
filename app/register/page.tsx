
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setMessage(
          "สมัครสมาชิกแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี ก่อนเข้าสู่ระบบ"
        );
      }
    } catch {
      setError("เชื่อมต่อระบบไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b10] px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold">
            D
          </div>

          <h1 className="text-2xl font-bold">Create account</h1>

          <p className="mt-2 text-sm text-gray-400">
            สมัครสมาชิก DataVault
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-gray-300">
              อีเมล
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-gray-300">
              รหัสผ่าน
            </label>

            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="อย่างน้อย 8 ตัวอักษร"
              className="w-full rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm text-gray-300">
              ยืนยันรหัสผ่าน
            </label>

            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              className="w-full rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </main>
  );
}
