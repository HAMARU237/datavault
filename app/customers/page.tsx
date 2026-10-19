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
  const [searchTerm, setSearchTerm] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

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

      const { data, error: queryError } = await supabase
        .from("customers")
        .select("id, name, email, phone, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) {
        setError(`โหลดข้อมูลไม่สำเร็จ: ${queryError.message}`);
        setCustomers([]);
      } else {
        setCustomers((data ?? []) as Customer[]);
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setEditingId(null);
  }

  function handleStartEdit(customer: Customer) {
    setEditingId(customer.id);
    setName(customer.name);
    setEmail(customer.email ?? "");
    setPhone(customer.phone ?? "");
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmitCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("กรุณากรอกชื่อลูกค้า");
      return;
    }
    if (trimmedName.length > 200) {
      setError("ชื่อลูกค้าต้องไม่เกิน 200 ตัวอักษร");
      return;
    }
    if (trimmedEmail.length > 254) {
      setError("อีเมลต้องไม่เกิน 254 ตัวอักษร");
      return;
    }
    if (trimmedPhone.length > 30) {
      setError("เบอร์โทรศัพท์ต้องไม่เกิน 30 ตัวอักษร");
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

      if (editingId !== null) {
        const { data, error: updateError } = await supabase
          .from("customers")
          .update({
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
          })
          .eq("id", editingId)
          .eq("user_id", user.id)
          .select("id");

        if (updateError) {
          setError(`แก้ไขข้อมูลไม่สำเร็จ: ${updateError.message}`);
          return;
        }
        if (!data || data.length === 0) {
          setError("ไม่พบข้อมูลลูกค้าที่ต้องการแก้ไข หรือคุณไม่มีสิทธิ์แก้ไขรายการนี้");
          return;
        }

        resetForm();
        setSuccess("แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว");
      } else {
        const { error: insertError } = await supabase.from("customers").insert({
          user_id: user.id,
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
        });

        if (insertError) {
          setError(`เพิ่มลูกค้าไม่สำเร็จ: ${insertError.message}`);
          return;
        }

        resetForm();
        setSuccess("เพิ่มข้อมูลลูกค้าเรียบร้อยแล้ว");
      }

      await loadCustomers();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
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
      const { data: userData, error: authError } = await supabase.auth.getUser();

      if (authError || !userData.user) {
        router.replace("/login");
        return;
      }

      const { data, error: deleteError } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id)
        .eq("user_id", userData.user.id)
        .select("id");

      if (deleteError) {
        setError(`ลบข้อมูลไม่สำเร็จ: ${deleteError.message}`);
        return;
      }
      if (!data || data.length === 0) {
        setError("ไม่พบข้อมูลลูกค้าที่ต้องการลบ หรือคุณไม่มีสิทธิ์ลบรายการนี้");
        return;
      }

      setCustomers((current) => current.filter((item) => item.id !== customer.id));
      if (editingId === customer.id) resetForm();
      setSuccess("ลบข้อมูลลูกค้าเรียบร้อยแล้ว");
    } catch {
      setError("เกิดข้อผิดพลาดระหว่างลบข้อมูล กรุณาลองใหม่");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const query = searchTerm.trim().toLocaleLowerCase();
    if (!query) return true;
    return [customer.name, customer.email, customer.phone].some((value) =>
      String(value ?? "").toLocaleLowerCase().includes(query),
    );
  });

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm text-white outline-none focus:border-violet-500";

  return (
    <main className="min-h-screen bg-[#0b0b10] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-violet-400">DATAVAULT / CUSTOMERS</p>
            <h1 className="mt-2 text-3xl font-bold">จัดการลูกค้า</h1>
            <p className="mt-2 text-sm text-gray-400">
              เพิ่ม ดู แก้ไข และลบข้อมูลลูกค้าของคุณ
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
          <h2 className="mb-5 text-lg font-semibold">
            {editingId !== null ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}
          </h2>
          <form onSubmit={handleSubmitCustomer} className="grid gap-4 md:grid-cols-3">
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
                className={inputClass}
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
                className={inputClass}
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
                className={inputClass}
              />
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "กำลังบันทึก..."
                  : editingId !== null
                    ? "บันทึกการแก้ไข"
                    : "+ เพิ่มลูกค้า"}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setError("");
                    setSuccess("");
                  }}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-300 hover:bg-white/5"
                >
                  ยกเลิก
                </button>
              )}
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
            <span className="text-sm text-gray-400">พบ {filteredCustomers.length} / {customers.length} ราย</span>
          </div>

          <div className="border-b border-white/10 p-5">
            <label htmlFor="customer-search" className="mb-2 block text-sm text-gray-300">ค้นหาลูกค้า</label>
            <input
              id="customer-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ค้นหาจากชื่อ อีเมล หรือเบอร์โทรศัพท์..."
              className="w-full rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-violet-500"
            />
          </div>

          {loading ? (
            <p className="p-8 text-center text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
          ) : customers.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-300">ยังไม่มีข้อมูลลูกค้า</p>
              <p className="mt-2 text-sm text-gray-500">เพิ่มลูกค้าจากแบบฟอร์มด้านบนได้เลย</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-white/[0.03] text-gray-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">ชื่อลูกค้า</th>
                    <th className="px-5 py-4 font-medium">อีเมล</th>
                    <th className="px-5 py-4 font-medium">เบอร์โทรศัพท์</th>
                    <th className="px-5 py-4 text-right font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-t border-white/10">
                      <td className="px-5 py-4 font-medium">{customer.name}</td>
                      <td className="px-5 py-4 text-gray-400">{customer.email || "—"}</td>
                      <td className="px-5 py-4 text-gray-400">{customer.phone || "—"}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(customer)}
                            className="rounded-lg border border-violet-500/30 px-3 py-2 text-xs text-violet-300 transition hover:bg-violet-500/10"
                          >
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteCustomer(customer)}
                            disabled={deletingId === customer.id}
                            className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {deletingId === customer.id ? "กำลังลบ..." : "ลบ"}
                          </button>
                        </div>
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
