
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "../../utils/supabase/server";
import AddProductForm from "./AddProductForm";
import ProductList from "./ProductList";

export type Product = {
  id: number | string;
  name: string;
  sku: string | null;
  category: string | null;
  price: number;
  stock: number;
  created_at: string;
};

async function ProductsContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, sku, category, price, stock, created_at")
    .order("created_at", { ascending: false });

  const productList: Product[] = (products ?? []).map((item) => ({
    id: item.id,
    name: item.name ?? "",
    sku: item.sku ?? null,
    category: item.category ?? null,
    price: Number(item.price ?? 0),
    stock: Number(item.stock ?? 0),
    created_at: item.created_at ?? "",
  }));

  return (
    <main className="min-h-screen bg-[#0b0b10] px-4 py-6 text-white sm:px-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm text-violet-400 transition hover:text-violet-300 hover:underline"
        >
          ← กลับ Dashboard
        </Link>

        <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-widest text-violet-400">
              DATAVAULT / PRODUCTS
            </p>
            <h1 className="mt-2 text-3xl font-bold">จัดการสินค้า</h1>
            <p className="mt-2 text-sm text-gray-400">
              เพิ่ม แก้ไข ค้นหา และจัดการข้อมูลสินค้า
            </p>
          </div>

          <div className="rounded-xl border border-violet-500/20 bg-[#12121a] px-5 py-3">
            <p className="text-xs text-gray-400">สินค้าทั้งหมด</p>
            <p className="mt-1 text-2xl font-bold text-violet-300">
              {productList.length}
              <span className="ml-2 text-sm font-normal text-gray-400">
                รายการ
              </span>
            </p>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-violet-500/20 bg-[#12121a] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-xl text-violet-300">
              +
            </div>
            <div>
              <h2 className="text-lg font-semibold">เพิ่มสินค้าใหม่</h2>
              <p className="mt-1 text-sm text-gray-400">
                กรอกข้อมูลด้านล่างเพื่อเพิ่มสินค้าเข้าสู่ระบบ
              </p>
            </div>
          </div>

          <AddProductForm />
        </section>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            <p className="font-semibold">โหลดสินค้าไม่สำเร็จ</p>
            <p className="mt-1">{error.message}</p>
          </div>
        )}

        <section className="mt-8">
          <ProductList products={productList} />
        </section>

        <footer className="mt-8 border-t border-white/10 pt-5 text-xs text-gray-600">
          DataVault Management System · Products
        </footer>
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0b0b10] p-8 text-white">
          <p className="animate-pulse text-sm text-gray-400">
            กำลังโหลดข้อมูลสินค้า...
          </p>
        </main>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
