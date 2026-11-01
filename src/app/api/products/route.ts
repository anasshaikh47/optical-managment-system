import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query");
    const lowStock = searchParams.get("lowStock");

    const where: any = { isActive: true };

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { sku: { contains: query } },
        { brand: { contains: query } },
        { barcode: { contains: query } },
        { modelNumber: { contains: query } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    if (lowStock === "true") {
      const filtered = products.filter((p) => p.stockQuantity <= p.minStockAlert);
      return NextResponse.json({ success: true, data: filtered });
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      sku,
      barcode,
      brand,
      modelNumber,
      color,
      size,
      material,
      shape,
      lensIndex,
      coating,
      baseCurve,
      diameter,
      costPrice,
      sellingPrice,
      stockQuantity,
      minStockAlert,
      supplier,
      description,
    } = body;

    if (!name || !category || !sku) {
      return NextResponse.json(
        { success: false, error: "Name, category, and SKU are required" },
        { status: 400 }
      );
    }

    // Generate unique SKU if collision occurs or use provided
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Product with SKU "${sku}" already exists` },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        sku,
        barcode: barcode || null,
        brand: brand || null,
        modelNumber: modelNumber || null,
        color: color || null,
        size: size || null,
        material: material || null,
        shape: shape || null,
        lensIndex: lensIndex || null,
        coating: coating || null,
        baseCurve: baseCurve ? parseFloat(baseCurve) : null,
        diameter: diameter ? parseFloat(diameter) : null,
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        minStockAlert: parseInt(minStockAlert, 10) || 5,
        supplier: supplier || null,
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
