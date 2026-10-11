
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: number | string;
  productName: string;
};

export default function DeleteProductButton({
  productId,
  productName,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    if (deleting) return;

    setDeleting(true);
    setMessage("");

    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: productId }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(
          result.error || `ลบสินค้าไม่สำเร็จ (HTTP ${response.status})`
        );
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setMessage("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage("");
          setOpen(true);
        }}
        className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
      >
        ลบ
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setOpen(false);
              setMessage("");
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-title-${productId}`}
            aria-describedby={`delete-description-${productId}`}
            className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#12121a] p-6 text-white shadow-2xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-2xl text-red-300">
              !
            </div>

            <h2
              id={`delete-title-${productId}`}
              className="text-lg font-bold"
            >
              ยืนยันการลบสินค้า
            </h2>

            <p
              id={`delete-description-${productId}`}
              className="mt-3 break-words text-sm leading-6 text-gray-300"
            >
              คุณต้องการลบสินค้า{" "}
              <span className="font-semibold text-white">
                {productName}
              </span>{" "}
              ใช่หรือไม่? เมื่อลบแล้ว ข้อมูลจะถูกนำออกจากฐานข้อมูล
            </p>

            {message && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {message}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMessage("");
                }}
                disabled={deleting}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "กำลังลบ..." : "ยืนยันลบสินค้า"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
