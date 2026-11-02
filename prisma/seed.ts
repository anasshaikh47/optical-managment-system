import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Resetting VisionPulse Database to 1 clean sample record per table...");

  // 1. Clear all existing records
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeSetting.deleteMany();

  // 2. Store Setting (1 record)
  await prisma.storeSetting.create({
    data: {
      id: "default",
      storeName: "VisionPulse Eyewear Studio",
      tagline: "Precision Clinical Optometry & Premium Eyewear",
      gstin: "27AABCV1234F1Z8",
      phone: "+91 98201 12345",
      email: "care@visionpulse.in",
      address: "Shop 4 & 5, Galleria Arcade, Hiranandani Gardens, Powai, Mumbai - 400076",
      currencySymbol: "₹",
      currencyCode: "INR",
      defaultGstRate: 12.0,
      receiptFooter:
        "1-Year warranty against frame manufacturing defects. Spectacle power adaptation guarantee for 14 days. Thank you for choosing VisionPulse!",
    },
  });

  // 3. User (1 record)
  const sampleUser = await prisma.user.create({
    data: {
      name: "Rajesh Sharma",
      email: "rajesh@visionpulse.in",
      role: "OWNER",
      pin_hash: "1234",
    },
  });

  // 4. Customer (1 record)
  const sampleCustomer = await prisma.customer.create({
    data: {
      name: "Aarav Patel",
      phone: "+91 98201 23456",
      email: "aarav.patel@gmail.com",
      address: "A-402, Sea Green Apts, Juhu Tara Road, Mumbai - 400049",
      dob: new Date("1992-05-15"),
      loyalty_points: 150,
    },
  });

  // 5. Prescription (1 record)
  const samplePrescription = await prisma.prescription.create({
    data: {
      customerId: sampleCustomer.id,
      optometristName: "Dr. Priya Nair, M.Opt",
      od_sph: -1.75,
      od_cyl: -0.50,
      od_axis: 90,
      od_add: 1.50,
      os_sph: -1.50,
      os_cyl: -0.75,
      os_axis: 85,
      os_add: 1.50,
      pd_distance: 63.0,
      pd_near: 60.0,
      lens_type: "SINGLE_VISION",
      notes: "Anti-glare ARC with blue-cut coating for daily screen work",
    },
  });

  // 6. Inventory Items (1 Frame & 1 Lens)
  const sampleFrame = await prisma.inventoryItem.create({
    data: {
      sku: "RB-5154",
      barcode: "805289126577",
      type: "FRAME",
      brand: "Ray-Ban",
      model: "Clubmaster Classic",
      color: "Mock Tortoise / Gold",
      size: "51-21-145",
      cost_price: 3600,
      selling_price: 7890,
      gst_rate: 12.0,
      stock_quantity: 12,
      min_alert_threshold: 3,
      image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80",
    },
  });

  const sampleLens = await prisma.inventoryItem.create({
    data: {
      sku: "ZEISS-SV156",
      barcode: "890123456001",
      type: "LENS",
      brand: "Carl Zeiss",
      model: "ClearView Single Vision 1.56",
      lens_index: "1.56",
      cost_price: 950,
      selling_price: 2400,
      gst_rate: 12.0,
      stock_quantity: 20,
      min_alert_threshold: 5,
      image_url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=400&q=80",
    },
  });

  // 7. Order (1 record)
  const sampleOrder = await prisma.order.create({
    data: {
      bill_no: "VP-2026-0001",
      customerId: sampleCustomer.id,
      prescriptionId: samplePrescription.id,
      status: "READY_FOR_PICKUP",
      total_amount: 10490, // 7890 + 2400 + 200 fitting
      discount_amount: 500,
      tax_amount: 1198.8,
      final_payable: 11189,
      paid_amount: 6000,
      balance_amount: 5189,
      delivery_due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
    },
  });

  // 8. Order Items
  await prisma.orderItem.create({
    data: {
      orderId: sampleOrder.id,
      itemId: sampleFrame.id,
      quantity: 1,
      unit_price: 7890,
      coating_charges: 0,
      fitting_charges: 0,
      subtotal: 7890,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: sampleOrder.id,
      itemId: sampleLens.id,
      quantity: 1,
      unit_price: 2400,
      coating_charges: 0,
      fitting_charges: 200,
      subtotal: 2600,
    },
  });

  // 9. Payment (1 record)
  await prisma.payment.create({
    data: {
      orderId: sampleOrder.id,
      method: "UPI",
      amount: 6000,
      payment_type: "ADVANCE",
      transaction_ref: "UPI/PAYTM/9820123456",
    },
  });

  console.log("✅ Seed completed successfully: Database now contains clean 1-sample records per table.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
