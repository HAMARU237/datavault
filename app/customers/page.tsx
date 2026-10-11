
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/login");
      return;
    }

    const { data, error: queryError } = await supabase
      .from("customers")
      .select("id, name, email, phone, created_at")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(`โหลดข้อมูลไม่สำเร็จ: ${queryError.message}`);
      setCustomers([]);
    } else {
      setCustomers((data ?? []) as Customer[]);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  async function handleAddCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("กรุณากรอกชื่อลูกค้า");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { error: insertError } = await supabase
        .from("customers")
        .insert({
          user_id: user.id,
          name: trimmedName,
          email: email.trim(),
          phone: phone.trim(),
        });

      if (insertError) {
        setError(`เพิ่มลูกค้าไม่สำเร็จ: ${insertError.message}`);
        return;
      }

      setName("");
      setEmail("");
      setPhone("");
      setSuccess("เพิ่มข้อมูลลูกค้าเรียบร้อยแล้ว");
      await loadCustomers();
    } catch {
      setError("เกิดข้อผิดพลาดระหว่างเพิ่มข้อมูล กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCustomer(customer: Customer) {
    const confirmed = window.confirm(
      `ต้องการลบข้อมูลลูกค้า "${customer.name}" ใช่หรือไม่?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(customer.id);

    try {
      const supabase = createClient();

      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !userData.user) {
        router.replace("/login");
        return;
      }

      const { error: deleteError } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id)
        .eq("user_id", userData.user.id);

      if (deleteError) {
        setError(`ลบข้อมูลไม่สำเร็จ: ${deleteError.message}`);
        return;
      }

      setCustomers((current) =>
        current.filter((item) => item.id !== customer.id),
      );
      setSuccess("ลบข้อมูลลูกค้าเรียบร้อยแล้ว");
    } catch {
      setError("เกิดข้อผิดพลาดระหว่างลบข้อมูล กรุณาลองใหม่");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b10] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-violet-400">DATAVAULT / CUSTOMERS</p>
            <h1 className="mt-2 text-3xl font-bold">จัดการลูกค้า</h1>
            <p className="mt-2 text-sm text-gray-400">
              เพิ่ม ดู และลบข้อมูลลูกค้าของคุณ
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
          >
            ← กลับ Dashboard
          </button>
        </div>

        <section className="mb-8 rounded-2xl border border-white/10 bg-[#12121a] p-6">
          <h2 className="mb-5 text-lg font-semibold">เพิ่มลูกค้าใหม่</h2>

          <form onSubmit={handleAddCustomer} className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="customer-name" className="mb-2 block text-sm text-gray-300">
                ชื่อลูกค้า *
              </label>
              <input
                id="customer-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={200}
                placeholder="กรอกชื่อลูกค้า"
                className="w-full rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label htmlFor="customer-email" className="mb-2 block text-sm text-gray-300">
                อีเมล
              </label>
              <input
                id="customer-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label htmlFor="customer-phone" className="mb-2 block text-sm text-gray-300">
                เบอร์โทรศัพท์
              </label>
              <input
                id="customer-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={30}
                placeholder="กรอกเบอร์โทรศัพท์"
                className="w-full rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "+ เพิ่มลูกค้า"}
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
            <h2 className="font-semibold">รายชื่อลูกค้า</h2>
            <span className="text-sm text-gray-400">
              ทั้งหมด {customers.length} ราย
            </span>
          </div>

          {loading ? (
            <p className="p-8 text-center text-sm text-gray-400">
              กำลังโหลดข้อมูล...
            </p>
          ) : customers.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-300">ยังไม่มีข้อมูลลูกค้า</p>
              <p className="mt-2 text-sm text-gray-500">
                เพิ่มลูกค้าจากแบบฟอร์มด้านบนได้เลย
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-white/[0.03] text-gray-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">ชื่อลูกค้า</th>
                    <th className="px-5 py-4 font-medium">อีเมล</th>
                    <th className="px-5 py-4 font-medium">เบอร์โทรศัพท์</th>
                    <th className="px-5 py-4 text-right font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-t border-white/10">
                      <td className="px-5 py-4 font-medium">
                        {customer.name}
                      </td>
                      <td className="px-5 py-4 text-gray-400">
                        {customer.email || "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-400">
                        {customer.phone || "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void handleDeleteCustomer(customer)}
                          disabled={deletingId === customer.id}
                          className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {deletingId === customer.id ? "กำลังลบ..." : "ลบ"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
