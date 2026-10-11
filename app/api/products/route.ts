
import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

type ProductInput = {
  id?: unknown;
  name?: unknown;
  sku?: unknown;
  category?: unknown;
  price?: unknown;
  stock?: unknown;
};

type ValidProduct = {
  name: string;
  sku: string | null;
  category: string | null;
  price: number;
  stock: number;
};

function validateProduct(
  input: ProductInput
): { data: ValidProduct; error?: never } | { data?: never; error: string } {
  const name =
    typeof input.name === "string" ? input.name.trim() : "";

  const sku =
    typeof input.sku === "string" ? input.sku.trim() : "";

  const category =
    typeof input.category === "string"
      ? input.category.trim()
      : "";

  if (!name) {
    return { error: "กรุณากรอกชื่อสินค้า" };
  }

  if (name.length > 150) {
    return { error: "ชื่อสินค้าต้องไม่เกิน 150 ตัวอักษร" };
  }

  if (
    (input.sku != null && typeof input.sku !== "string") ||
    (input.category != null &&
      typeof input.category !== "string")
  ) {
    return { error: "รูปแบบ SKU หรือหมวดหมู่ไม่ถูกต้อง" };
  }

  if (sku.length > 60) {
    return { error: "SKU ต้องไม่เกิน 60 ตัวอักษร" };
  }

  if (category.length > 100) {
    return { error: "หมวดหมู่ต้องไม่เกิน 100 ตัวอักษร" };
  }

  if (
    typeof input.price !== "number" ||
    !Number.isFinite(input.price) ||
    input.price < 0 ||
    input.price > 999999999
  ) {
    return {
      error: "ราคาต้องเป็นตัวเลขตั้งแต่ 0 ถึง 999999999",
    };
  }

  if (
    typeof input.stock !== "number" ||
    !Number.isSafeInteger(input.stock) ||
    input.stock < 0 ||
    input.stock > 2147483647
  ) {
    return {
      error: "จำนวนสินค้าต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง 2147483647",
    };
  }

  return {
    data: {
      name,
      sku: sku || null,
      category: category || null,
      price: input.price,
      stock: input.stock,
    },
  };
}

function isObjectBody(body: unknown): body is Record<string, unknown> {
  return (
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body)
  );
}

async function getAuthenticatedClient() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return {
    supabase,
    user: error ? null : user,
  };
}

const PRODUCT_FIELDS =
  "id, name, sku, category, price, stock, created_at";

// GET: แสดงสินค้าทั้งหมด หรือค้นหาสินค้าด้วย ID
export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedClient();

  if (!user) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบก่อนดูข้อมูลสินค้า" },
      { status: 401 }
    );
  }

  const id = new URL(request.url).searchParams.get("id");

  let query = supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (id !== null) {
    if (!id.trim()) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    query = query.eq("id", id.trim());
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("Get products failed:", error.code);

    return NextResponse.json(
      { error: "ไม่สามารถโหลดข้อมูลสินค้าได้" },
      { status: 500 }
    );
  }

  if (id !== null && (!products || products.length === 0)) {
    return NextResponse.json(
      { error: "ไม่พบสินค้าหรือคุณไม่มีสิทธิ์ดูสินค้านี้" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    id !== null
      ? { product: products?.[0] }
      : { products: products ?? [] },
    { status: 200 }
  );
}

// POST: เพิ่มสินค้า
export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedClient();

  if (!user) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้า" },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  if (!isObjectBody(body)) {
    return NextResponse.json(
      { error: "ข้อมูลสินค้าต้องเป็น object" },
      { status: 400 }
    );
  }

  const result = validateProduct(body as ProductInput);

  if (!result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      user_id: user.id,
      ...result.data,
    })
    .select(PRODUCT_FIELDS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "SKU นี้มีอยู่แล้ว กรุณาใช้ SKU อื่น" },
        { status: 409 }
      );
    }

    console.error("Create product failed:", error.code);

    return NextResponse.json(
      { error: "บันทึกสินค้าไม่สำเร็จ กรุณาตรวจสอบข้อมูลและสิทธิ์ฐานข้อมูล" },
      { status: 500 }
    );
  }

  return NextResponse.json({ product }, { status: 201 });
}

// PUT: แก้ไขสินค้า
export async function PUT(request: Request) {
  const { supabase, user } = await getAuthenticatedClient();

  if (!user) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบก่อนแก้ไขสินค้า" },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  if (!isObjectBody(body)) {
    return NextResponse.json(
      { error: "ข้อมูลสินค้าต้องเป็น object" },
      { status: 400 }
    );
  }

  const input = body as ProductInput;

  // รองรับ ID ทั้ง string และ number
  if (
    (typeof input.id !== "string" &&
      typeof input.id !== "number") ||
    String(input.id).trim() === "" ||
    (typeof input.id === "number" &&
      !Number.isSafeInteger(input.id))
  ) {
    return NextResponse.json(
      { error: "ไม่พบรหัสสินค้าที่ต้องการแก้ไข" },
      { status: 400 }
    );
  }

  const id = String(input.id).trim();
  const result = validateProduct(input);

  if (!result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  const { data: product, error } = await supabase
    .from("products")
    .update(result.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(PRODUCT_FIELDS)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "SKU นี้มีอยู่แล้ว กรุณาใช้ SKU อื่น" },
        { status: 409 }
      );
    }

    console.error("Update product failed:", error.code);

    return NextResponse.json(
      { error: "แก้ไขสินค้าไม่สำเร็จ กรุณาตรวจสอบข้อมูลและสิทธิ์ฐานข้อมูล" },
      { status: 500 }
    );
  }

  if (!product) {
    return NextResponse.json(
      { error: "ไม่พบสินค้าหรือคุณไม่มีสิทธิ์แก้ไขสินค้านี้" },
      { status: 404 }
    );
  }

  return NextResponse.json({ product }, { status: 200 });
}

// DELETE: ลบสินค้าด้วย ID
export async function DELETE(request: Request) {
  const { supabase, user } = await getAuthenticatedClient();

  if (!user) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบก่อนลบสินค้า" },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  if (
    !isObjectBody(body) ||
    !("id" in body) ||
    (typeof body.id !== "string" &&
      typeof body.id !== "number") ||
    String(body.id).trim() === "" ||
    (typeof body.id === "number" &&
      !Number.isSafeInteger(body.id))
  ) {
    return NextResponse.json(
      { error: "กรุณาระบุรหัสสินค้าที่ต้องการลบ" },
      { status: 400 }
    );
  }

  const id = String(body.id).trim();

  const { data: deletedProduct, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Delete product failed:", error.code);

    return NextResponse.json(
      { error: "ลบสินค้าไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ฐานข้อมูล" },
      { status: 500 }
    );
  }

  if (!deletedProduct) {
    return NextResponse.json(
      { error: "ไม่พบสินค้าหรือคุณไม่มีสิทธิ์ลบสินค้านี้" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { message: "ลบสินค้าสำเร็จ", id: deletedProduct.id },
    { status: 200 }
  );
}
