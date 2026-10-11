
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "../utils/supabase/server";

async function DashboardContent() {
  // Render this part at request time before reading the current date.
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const datePart = (type: string) =>
    todayParts.find((part) => part.type === type)?.value ?? "";

  const today = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;

  const [
    productsResult,
    customersResult,
    todayExpensesResult,
    allExpensesResult,
  ] = await Promise.all([
    supabase.from("products").select("*", {
      count: "exact",
      head: true,
    }),
    supabase.from("customers").select("*", {
      count: "exact",
      head: true,
    }),
    supabase
      .from("expenses")
      .select("amount")
      .eq("expense_date", today),
    supabase.from("expenses").select("amount"),
  ]);

  const queryErrors = [
    productsResult.error,
    customersResult.error,
    todayExpensesResult.error,
    allExpensesResult.error,
  ].filter(Boolean);

  const todayExpenses = (todayExpensesResult.data ?? []).reduce(
    (sum, expense) => sum + Number(expense.amount ?? 0),
    0,
  );

  const allExpenses = (allExpensesResult.data ?? []).reduce(
    (sum, expense) => sum + Number(expense.amount ?? 0),
    0,
  );

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("th-TH").format(value);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const stats = [
    {
      label: "สินค้าทั้งหมด",
      value:
        productsResult.count === null
          ? "—"
          : formatNumber(productsResult.count),
      description: "จำนวนสินค้าในระบบ",
      symbol: "▦",
      color: "text-violet-300",
      background: "bg-violet-500/10",
    },
    {
      label: "ลูกค้าทั้งหมด",
      value:
        customersResult.count === null
          ? "—"
          : formatNumber(customersResult.count),
      description: "จำนวนลูกค้าที่บันทึกไว้",
      symbol: "♙",
      color: "text-sky-300",
      background: "bg-sky-500/10",
    },
    {
      label: "รายจ่ายวันนี้",
      value: todayExpensesResult.error ? "—" : formatMoney(todayExpenses),
      description: today,
      symbol: "↘",
      color: "text-amber-300",
      background: "bg-amber-500/10",
    },
    {
      label: "รายการรายจ่ายทั้งหมด",
      value: allExpensesResult.error ? "—" : formatMoney(allExpenses),
      description: "ยอดรายจ่ายสะสม",
      symbol: "฿",
      color: "text-emerald-300",
      background: "bg-emerald-500/10",
    },
  ];

  const navigation = [
    { label: "ภาพรวม", href: "/", symbol: "◫", active: true },
    { label: "จัดการสินค้า", href: "/products", symbol: "▦" },
    { label: "จัดการลูกค้า", href: "/customers", symbol: "♙" },
    { label: "จัดการรายจ่าย", href: "/expenses", symbol: "↘" },
  ];

  return (
    <main className="min-h-screen bg-[#0b0b10] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#101018] p-6 md:flex md:flex-col">
          <a href="/" className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-xl font-bold text-white">
              D
            </div>
            <div>
              <p className="text-lg font-bold tracking-wide">DataVault</p>
              <p className="text-xs text-slate-500">Management System</p>
            </div>
          </a>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            เมนูหลัก
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  item.active
                    ? "bg-violet-500/15 font-semibold text-violet-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.symbol}</span>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-1 text-sm font-semibold">สถานะระบบ</p>
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              เชื่อมต่อ Supabase
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-8">
            <div>
              <p className="text-sm text-slate-500">DataVault / ภาพรวม</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">ผู้ใช้งาน</p>
                <p className="max-w-56 truncate text-xs text-slate-500">
                  {user.email}
                </p>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  ออกจากระบบ
                </button>
              </form>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
            <div>
              <p className="text-sm text-violet-300">
                ยินดีต้อนรับกลับมา
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                ภาพรวมระบบจัดการข้อมูล
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                ตรวจสอบข้อมูลสินค้า ลูกค้า และรายจ่ายของคุณได้ที่นี่
              </p>
            </div>

            {queryErrors.length > 0 && (
              <div
                role="alert"
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200"
              >
                โหลดข้อมูลบางส่วนไม่สำเร็จ กรุณาตรวจสอบชื่อตาราง คอลัมน์
                และสิทธิ์ RLS ใน Supabase
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-[#12121b] p-5 transition hover:border-violet-500/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${stat.background} ${stat.color}`}
                    >
                      {stat.symbol}
                    </div>
                  </div>
                  <p className="mt-5 break-words text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {stat.description}
                  </p>
                </article>
              ))}
            </div>

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold">เมนูทางลัด</h2>
                <p className="mt-1 text-sm text-slate-500">
                  เลือกส่วนที่ต้องการจัดการ
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <a
                  href="/products"
                  className="group rounded-2xl border border-white/10 bg-[#12121b] p-6 transition hover:-translate-y-0.5 hover:border-violet-500/40"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-xl text-violet-300">
                    ▦
                  </div>
                  <h3 className="font-semibold group-hover:text-violet-300">
                    จัดการสินค้า
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    ดูและเพิ่มข้อมูลสินค้าในระบบ
                  </p>
                  <p className="mt-4 text-sm text-violet-300">
                    ไปหน้าสินค้า →
                  </p>
                </a>

                <a
                  href="/customers"
                  className="group rounded-2xl border border-white/10 bg-[#12121b] p-6 transition hover:-translate-y-0.5 hover:border-sky-500/40"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-xl text-sky-300">
                    ♙
                  </div>
                  <h3 className="font-semibold group-hover:text-sky-300">
                    จัดการลูกค้า
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    ดูและจัดการข้อมูลลูกค้า
                  </p>
                  <p className="mt-4 text-sm text-sky-300">
                    ไปหน้าลูกค้า →
                  </p>
                </a>

                <a
                  href="/expenses"
                  className="group rounded-2xl border border-white/10 bg-[#12121b] p-6 transition hover:-translate-y-0.5 hover:border-emerald-500/40"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-xl text-emerald-300">
                    ฿
                  </div>
                  <h3 className="font-semibold group-hover:text-emerald-300">
                    จัดการรายจ่าย
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    ตรวจสอบและบันทึกรายจ่าย
                  </p>
                  <p className="mt-4 text-sm text-emerald-300">
                    ไปหน้ารายจ่าย →
                  </p>
                </a>
              </div>
            </section>

            <footer className="border-t border-white/10 pt-5 text-xs text-slate-500">
              DataVault Management System · เชื่อมต่อฐานข้อมูล Supabase
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0b0b10] p-8 text-white">
          กำลังโหลด Dashboard...
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
