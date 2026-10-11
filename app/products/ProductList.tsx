
"use client";

import { useMemo, useState } from "react";
import type { Product } from "./page";
import EditProductButton from "./EditProductButton";
import DeleteProductButton from "./DeleteProductButton";

type Props = {
  products: Product[];
};

export default function ProductList({ products }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b, "th"));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.sku ?? "",
        product.category ?? "",
      ].some((value) => value.toLowerCase().includes(keyword));

      const matchesCategory =
        category === "all" || product.category?.trim() === category;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "available" && product.stock > 0) ||
        (stockFilter === "out" && product.stock <= 0);

      return matchesSearch && matchesCategory && matchesStock;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name, "th");
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
      }
    });

    return result;
  }, [products, search, category, stockFilter, sortBy]);

  function resetFilters() {
    setSearch("");
    setCategory("all");
    setStockFilter("all");
    setSortBy("newest");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]">
      <div className="border-b border-white/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">รายการสินค้า</h2>
            <p className="mt-1 text-sm text-gray-400">
              ค้นหา กรอง และเรียงลำดับข้อมูลสินค้า
            </p>
          </div>

          <span className="rounded-lg border border-violet-500/20 px-3 py-2 text-xs text-violet-300">
            พบ {filteredProducts.length} / {products.length} รายการ
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาชื่อสินค้า, SKU, หมวดหมู่"
            aria-label="ค้นหาสินค้า"
            className="rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-violet-500"
          />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="กรองตามหมวดหมู่"
            className="rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            aria-label="กรองตามจำนวนสินค้า"
            className="rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
          >
            <option value="all">สินค้าทุกสถานะ</option>
            <option value="available">มีสินค้า</option>
            <option value="out">สินค้าหมด</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="เรียงลำดับสินค้า"
            className="rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
          >
            <option value="newest">เพิ่มล่าสุด</option>
            <option value="price-asc">ราคาน้อยไปมาก</option>
            <option value="price-desc">ราคามากไปน้อย</option>
            <option value="name">ชื่อสินค้า A–Z</option>
          </select>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="mt-3 rounded-lg border border-white/10 px-4 py-2 text-xs text-gray-300 transition hover:border-violet-500/50 hover:text-white"
        >
          ล้างตัวกรอง
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02] text-gray-400">
            <tr>
              <th className="px-5 py-4 font-medium">ชื่อสินค้า</th>
              <th className="px-5 py-4 font-medium">SKU</th>
              <th className="px-5 py-4 font-medium">หมวดหมู่</th>
              <th className="px-5 py-4 text-right font-medium">ราคา</th>
              <th className="px-5 py-4 text-right font-medium">คงเหลือ</th>
              <th className="px-5 py-4 text-center font-medium">จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-4 font-medium">
                    {product.name}
                  </td>

                  <td className="px-5 py-4 text-gray-400">
                    {product.sku || "—"}
                  </td>

                  <td className="px-5 py-4 text-gray-400">
                    {product.category || "—"}
                  </td>

                  <td className="px-5 py-4 text-right tabular-nums">
                    ฿
                    {product.price.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td className="px-5 py-4 text-right tabular-nums">
                    <span
                      className={
                        product.stock > 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {product.stock.toLocaleString("th-TH")}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <EditProductButton product={product} />
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-gray-300">
                    ไม่พบสินค้าที่ตรงกับเงื่อนไข
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
