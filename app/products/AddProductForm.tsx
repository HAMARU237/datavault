
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AddProductForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-violet-500 disabled:opacity-50";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setMessage("");
    setSuccess(false);

    const cleanName = name.trim();
    const cleanSku = sku.trim();
    const cleanCategory = category.trim();

    if (!cleanName || cleanName.length > 150) {
      setMessage("กรุณากรอกชื่อสินค้า 1–150 ตัวอักษร");
      return;
    }

    if (cleanSku.length > 60) {
      setMessage("SKU ต้องมีความยาวไม่เกิน 60 ตัวอักษร");
      return;
    }

    if (cleanCategory.length > 100) {
      setMessage("หมวดหมู่ต้องมีความยาวไม่เกิน 100 ตัวอักษร");
      return;
    }

    if (price.trim() === "") {
      setMessage("กรุณากรอกราคาสินค้า");
      return;
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      numericPrice > 999999999
    ) {
      setMessage("ราคาต้องอยู่ระหว่าง 0 ถึง 999,999,999 บาท");
      return;
    }

    if (stock.trim() === "") {
      setMessage("กรุณากรอกจำนวนสินค้าคงเหลือ");
      return;
    }

    const numericStock = Number(stock);

    if (
      !Number.isSafeInteger(numericStock) ||
      numericStock < 0 ||
      numericStock > 2147483647
    ) {
      setMessage("จำนวนสินค้าต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          sku: cleanSku || null,
          category: cleanCategory || null,
          price: numericPrice,
          stock: numericStock,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(
          result.error ||
            result.message ||
            `เพิ่มสินค้าไม่สำเร็จ (HTTP ${response.status})`
        );
        return;
      }

      setName("");
      setSku("");
      setCategory("");
      setPrice("");
      setStock("");

      setSuccess(true);
      setMessage("เพิ่มสินค้าสำเร็จ");
      router.refresh();
    } catch {
      setMessage("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="product-name"
            className="mb-2 block text-sm text-gray-300"
          >
            ชื่อสินค้า *
          </label>
          <input
            id="product-name"
            type="text"
            required
            maxLength={150}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="กรอกชื่อสินค้า"
            className={inputClass}
            disabled={saving}
          />
        </div>

        <div>
          <label
            htmlFor="product-sku"
            className="mb-2 block text-sm text-gray-300"
          >
            SKU
          </label>
          <input
            id="product-sku"
            type="text"
            maxLength={60}
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            placeholder="รหัสสินค้า (ถ้ามี)"
            className={inputClass}
            disabled={saving}
          />
        </div>

        <div>
          <label
            htmlFor="product-category"
            className="mb-2 block text-sm text-gray-300"
          >
            หมวดหมู่
          </label>
          <input
            id="product-category"
            type="text"
            maxLength={100}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="เช่น อุปกรณ์สำนักงาน"
            className={inputClass}
            disabled={saving}
          />
        </div>

        <div>
          <label
            htmlFor="product-price"
            className="mb-2 block text-sm text-gray-300"
          >
            ราคา (บาท) *
          </label>
          <input
            id="product-price"
            type="number"
            required
            min="0"
            max="999999999"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0.00"
            className={inputClass}
            disabled={saving}
          />
        </div>

        <div>
          <label
            htmlFor="product-stock"
            className="mb-2 block text-sm text-gray-300"
          >
            จำนวนคงเหลือ *
          </label>
          <input
            id="product-stock"
            type="number"
            required
            min="0"
            max="2147483647"
            step="1"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            placeholder="0"
            className={inputClass}
            disabled={saving}
          />
        </div>
      </div>

      {message && (
        <p
          role={success ? "status" : "alert"}
          aria-live="polite"
          className={`rounded-xl border p-3 text-sm ${
            success
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message}
        </p>
      )}

      <div className="flex justify-end border-t border-white/10 pt-5">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "กำลังเพิ่มสินค้า..." : "+ เพิ่มสินค้า"}
        </button>
      </div>
    </form>
  );
}
