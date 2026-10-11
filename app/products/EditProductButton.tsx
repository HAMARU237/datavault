
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: number | string;
  name: string;
  sku: string | null;
  category: string | null;
  price: number;
  stock: number;
};

type Props = {
  product?: Product | null;
};

type ApiResult = {
  error?: string;
  message?: string;
};

export default function EditProductButton({ product }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openForm() {
    if (!product) {
      setError("ไม่พบข้อมูลสินค้าที่ต้องการแก้ไข");
      return;
    }

    setName(product.name ?? "");
    setSku(product.sku ?? "");
    setCategory(product.category ?? "");
    setPrice(String(product.price ?? 0));
    setStock(String(product.stock ?? 0));
    setError("");
    setOpen(true);
  }

  function closeForm() {
    if (saving) return;

    setOpen(false);
    setError("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    setError("");

    if (!product) {
      setError("ไม่พบข้อมูลสินค้า กรุณารีเฟรชหน้าเว็บ");
      return;
    }

    const cleanName = name.trim();
    const cleanSku = sku.trim();
    const cleanCategory = category.trim();

    if (!cleanName) {
      setError("กรุณากรอกชื่อสินค้า");
      return;
    }

    if (cleanName.length > 150) {
      setError("ชื่อสินค้าต้องไม่เกิน 150 ตัวอักษร");
      return;
    }

    if (cleanSku.length > 60) {
      setError("SKU ต้องไม่เกิน 60 ตัวอักษร");
      return;
    }

    if (cleanCategory.length > 100) {
      setError("หมวดหมู่ต้องไม่เกิน 100 ตัวอักษร");
      return;
    }

    if (price.trim() === "") {
      setError("กรุณากรอกราคาสินค้า");
      return;
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      numericPrice > 999999999
    ) {
      setError("ราคาต้องอยู่ระหว่าง 0 ถึง 999999999");
      return;
    }

    if (stock.trim() === "") {
      setError("กรุณากรอกจำนวนสินค้า");
      return;
    }

    const numericStock = Number(stock);

    if (
      !Number.isSafeInteger(numericStock) ||
      numericStock < 0 ||
      numericStock > 2147483647
    ) {
      setError(
        "จำนวนสินค้าต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง 2147483647"
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: product.id,
          name: cleanName,
          sku: cleanSku || null,
          category: cleanCategory || null,
          price: numericPrice,
          stock: numericStock,
        }),
      });

      let result: ApiResult = {};

      try {
        result = await response.json();
      } catch {
        // เซิร์ฟเวอร์อาจตอบกลับด้วยข้อมูลที่ไม่ใช่ JSON
      }

      if (!response.ok) {
        setError(
          result.error ||
            result.message ||
            `แก้ไขสินค้าไม่สำเร็จ (HTTP ${response.status})`
        );
        return;
      }

      setOpen(false);
      setError("");
      router.refresh();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openForm}
        className="rounded-lg border border-blue-500 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
      >
        แก้ไข
      </button>

      {error && !open && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="my-auto w-full max-w-lg space-y-4 rounded-xl bg-white p-6 text-gray-900 shadow-xl"
            aria-busy={saving}
          >
            <h2 className="text-xl font-semibold">แก้ไขสินค้า</h2>

            <div>
              <label
                htmlFor="edit-product-name"
                className="mb-1 block text-sm"
              >
                ชื่อสินค้า *
              </label>
              <input
                id="edit-product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={150}
                required
                disabled={saving}
                className="w-full rounded-lg border p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="edit-product-sku"
                className="mb-1 block text-sm"
              >
                SKU
              </label>
              <input
                id="edit-product-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                maxLength={60}
                disabled={saving}
                className="w-full rounded-lg border p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="edit-product-category"
                className="mb-1 block text-sm"
              >
                หมวดหมู่
              </label>
              <input
                id="edit-product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={100}
                disabled={saving}
                className="w-full rounded-lg border p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="edit-product-price"
                className="mb-1 block text-sm"
              >
                ราคา *
              </label>
              <input
                id="edit-product-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min={0}
                max={999999999}
                step="any"
                required
                disabled={saving}
                className="w-full rounded-lg border p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="edit-product-stock"
                className="mb-1 block text-sm"
              >
                จำนวนสินค้า *
              </label>
              <input
                id="edit-product-stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min={0}
                max={2147483647}
                step={1}
                required
                disabled={saving}
                className="w-full rounded-lg border p-2 disabled:bg-gray-100"
              />
            </div>

            {error && (
              <p
                className="text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
