"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

type Expense = {
  id: number;
  title: string;
  amount: number;
  expense_date: string;
  created_at: string;
};

function getTodayInThailand() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ExpensesPage() {
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [today, setToday] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const currentDate = getTodayInThailand();
    setToday(currentDate);
    setExpenseDate(currentDate);
  }, []);

  const loadExpenses = useCallback(async () => {
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
        .from("expenses")
        .select("id, title, amount, expense_date, created_at")
        .eq("user_id", user.id)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (queryError) {
        setError(`โหลดข้อมูลไม่สำเร็จ: ${queryError.message}`);
        setExpenses([]);
        return;
      }

      setExpenses((data ?? []) as Expense[]);
    } catch {
      setError("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  function resetForm() {
    setTitle("");
    setAmount("");
    setExpenseDate(getTodayInThailand());
    setEditingId(null);
  }

  function handleStartEdit(expense: Expense) {
    setEditingId(expense.id);
    setTitle(expense.title);
    setAmount(String(expense.amount));
    setExpenseDate(String(expense.expense_date ?? "").slice(0, 10));
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedTitle = title.trim();
    const parsedAmount = Number(amount);

    if (!trimmedTitle) {
      setError("กรุณากรอกรายละเอียดรายจ่าย");
      return;
    }
    if (trimmedTitle.length > 200) {
      setError("รายละเอียดรายจ่ายต้องไม่เกิน 200 ตัวอักษร");
      return;
    }
    if (
      amount.trim() === "" ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setError("กรุณากรอกจำนวนเงินที่มากกว่า 0");
      return;
    }
    if (!expenseDate) {
      setError("กรุณาเลือกวันที่รายจ่าย");
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
          .from("expenses")
          .update({
            title: trimmedTitle,
            amount: parsedAmount,
            expense_date: expenseDate,
          })
          .eq("id", editingId)
          .eq("user_id", user.id)
          .select("id");

        if (updateError) {
          setError(`แก้ไขรายจ่ายไม่สำเร็จ: ${updateError.message}`);
          return;
        }
        if (!data || data.length === 0) {
          setError("ไม่พบรายการที่ต้องการแก้ไข หรือคุณไม่มีสิทธิ์แก้ไขรายการนี้");
          return;
        }

        resetForm();
        setSuccess("แก้ไขรายการรายจ่ายเรียบร้อยแล้ว");
      } else {
        const { error: insertError } = await supabase.from("expenses").insert({
          user_id: user.id,
          title: trimmedTitle,
          amount: parsedAmount,
          expense_date: expenseDate,
        });

        if (insertError) {
          setError(`เพิ่มรายจ่ายไม่สำเร็จ: ${insertError.message}`);
          return;
        }

        resetForm();
        setSuccess("เพิ่มรายการรายจ่ายเรียบร้อยแล้ว");
      }

      await loadExpenses();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExpense(expense: Expense) {
    const confirmed = window.confirm(
      `ต้องการลบรายการ "${expense.title}" ใช่หรือไม่?`,
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(expense.id);

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

      const { data, error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expense.id)
        .eq("user_id", user.id)
        .select("id");

      if (deleteError) {
        setError(`ลบรายการไม่สำเร็จ: ${deleteError.message}`);
        return;
      }
      if (!data || data.length === 0) {
        setError("ไม่พบรายการที่ต้องการลบ หรือคุณไม่มีสิทธิ์ลบรายการนี้");
        return;
      }

      setExpenses((current) => current.filter((item) => item.id !== expense.id));
      if (editingId === expense.id) resetForm();
      setSuccess("ลบรายการรายจ่ายเรียบร้อยแล้ว");
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    const query = searchTerm.trim().toLocaleLowerCase();
    if (!query) return true;
    return [expense.title, String(expense.amount), expense.expense_date].some((value) =>
      String(value ?? "").toLocaleLowerCase().includes(query),
    );
  });

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );

  const todayTotal = expenses
    .filter((expense) => expense.expense_date === today)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm text-white outline-none focus:border-violet-500";

  return (
    <main className="min-h-screen bg-[#0b0b10] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-violet-400">DATAVAULT / EXPENSES</p>
            <h1 className="mt-2 text-3xl font-bold">จัดการรายจ่าย</h1>
            <p className="mt-2 text-sm text-gray-400">
              บันทึกและติดตามค่าใช้จ่ายของคุณ
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5"
          >
            ← กลับ Dashboard
          </button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
            <p className="text-sm text-gray-400">ยอดรายจ่ายทั้งหมด</p>
            <p className="mt-3 text-2xl font-bold text-violet-300">
              {formatMoney(totalExpenses)}
            </p>
            <p className="mt-2 text-xs text-gray-500">รวม {expenses.length} รายการ</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
            <p className="text-sm text-gray-400">ยอดรายจ่ายวันนี้</p>
            <p className="mt-3 text-2xl font-bold text-amber-300">
              {formatMoney(todayTotal)}
            </p>
            <p className="mt-2 text-xs text-gray-500">{today || "กำลังตรวจสอบวันที่..."}</p>
          </div>
        </div>

        <section className="mb-8 rounded-2xl border border-white/10 bg-[#12121a] p-6">
          <h2 className="mb-5 text-lg font-semibold">
            {editingId !== null ? "แก้ไขรายการรายจ่าย" : "เพิ่มรายจ่าย"}
          </h2>
          <form onSubmit={handleSubmitExpense} className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="expense-title" className="mb-2 block text-sm text-gray-300">
                รายละเอียด *
              </label>
              <input
                id="expense-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={200}
                placeholder="เช่น ค่าเดินทาง"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="expense-amount" className="mb-2 block text-sm text-gray-300">
                จำนวนเงิน (บาท) *
              </label>
              <input
                id="expense-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="expense-date" className="mb-2 block text-sm text-gray-300">
                วันที่รายจ่าย *
              </label>
              <input
                id="expense-date"
                type="date"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
                required
                style={{ colorScheme: "dark" }}
                className={`${inputClass} cursor-pointer`}
              />
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-3">
              <button
                type="submit"
                disabled={saving || !today}
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "กำลังบันทึก..."
                  : editingId !== null
                    ? "บันทึกการแก้ไข"
                    : "+ เพิ่มรายจ่าย"}
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
            <h2 className="font-semibold">รายการรายจ่าย</h2>
            <span className="text-sm text-gray-400">พบ {filteredExpenses.length} / {expenses.length} รายการ</span>
          </div>

          <div className="border-b border-white/10 p-5">
            <label htmlFor="expense-search" className="mb-2 block text-sm text-gray-300">ค้นหารายจ่าย</label>
            <input
              id="expense-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ค้นหาจากชื่อรายการ จำนวนเงิน หรือวันที่..."
              className="w-full rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-violet-500"
            />
          </div>

          {loading ? (
            <p className="p-8 text-center text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
          ) : expenses.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-300">ยังไม่มีรายการรายจ่าย</p>
              <p className="mt-2 text-sm text-gray-500">เพิ่มรายการแรกจากแบบฟอร์มด้านบนได้เลย</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">ไม่พบรายการรายจ่ายที่ตรงกับคำค้นหา</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-white/[0.03] text-gray-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">รายละเอียด</th>
                    <th className="px-5 py-4 font-medium">วันที่</th>
                    <th className="px-5 py-4 text-right font-medium">จำนวนเงิน</th>
                    <th className="px-5 py-4 text-right font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="border-t border-white/10">
                      <td className="px-5 py-4 font-medium">{expense.title}</td>
                      <td className="px-5 py-4 text-gray-400">{expense.expense_date}</td>
                      <td className="px-5 py-4 text-right font-medium text-amber-300">
                        {formatMoney(Number(expense.amount))}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(expense)}
                            className="rounded-lg border border-violet-500/30 px-3 py-2 text-xs text-violet-300 transition hover:bg-violet-500/10"
                          >
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteExpense(expense)}
                            disabled={deletingId === expense.id}
                            className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {deletingId === expense.id ? "กำลังลบ..." : "ลบ"}
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
