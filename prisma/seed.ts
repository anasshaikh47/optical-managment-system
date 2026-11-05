import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Resetting PharmaPulse Database to clean pharmacy records...");

  // 1. Clear all existing records
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeSetting.deleteMany();

  // 2. Store Setting (1 record)
  await prisma.storeSetting.create({
    data: {
      id: "default",
      storeName: "PharmaPulse Chemist & Druggist",
      tagline: "High-Efficiency Pharmacy & Clinical Healthcare ERP",
      gstin: "27AABCP9876F1Z2",
      dlNumber: "DL-20B/21B-458920",
      phone: "+91 98201 12345",
      email: "care@pharmapulse.in",
      address: "Shop 10 & 11, Central Avenue, Powai, Mumbai - 400076",
      currencySymbol: "₹",
      currencyCode: "INR",
      defaultGstRate: 12.0,
      receiptFooter:
        "Medicines sold against valid registered Doctor Prescription. Please check batch number & expiry date before consumption. Thank you for choosing PharmaPulse!",
    },
  });

  // 3. User (1 record)
  await prisma.user.create({
    data: {
      name: "Rajesh Sharma, R.Ph",
      email: "rajesh@pharmapulse.in",
      role: "OWNER",
      pin_hash: "1234",
    },
  });

  // 4. Customer / Patient (1 record)
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
      patientName: "Aarav Patel",
      patientAge: 34,
      doctorName: "Dr. Sandeep Deshmukh, MD",
      clinicOrHospital: "Apollo Clinic & Diagnostic Center",
      doctorRegNo: "MCI-48921",
      dosageInstructions: "Augmentin 625 (1-0-1 After Meals), Dolo 650 (1-0-1 if fever > 100°F)",
      notes: "Drink plenty of fluids. Complete 5-day course without skipping doses.",
    },
  });

  // 6. Pharmacy Medicines (with generic salts, batches, expiries, rack numbers)
  const med1 = await prisma.medicine.create({
    data: {
      sku: "MED-AUG625",
      barcode: "8901030784920",
      name: "Augmentin 625 Duo Tablet",
      genericSaltName: "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
      manufacturer: "GlaxoSmithKline Pharmaceuticals Ltd",
      packType: "Strip",
      tabletsPerStrip: 10,
      hsnCode: "30041010",
      rackLocation: "Rack A-01",
      minStockAlert: 15,
      scheduleType: "SCHEDULE_H",
      isScheduleH: true,
      batchNumber: "AUG-8492",
      expiryDate: "08/2027",
      mrp: 223.50,
      purchaseRate: 165.00,
      saleRate: 201.15,
      stripQuantity: 45,
      looseTabletQuantity: 6,
      gstRate: 12.0,
      image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
    },
  });

  const med2 = await prisma.medicine.create({
    data: {
      sku: "MED-DOLO650",
      barcode: "8901234560012",
      name: "Dolo 650 Tablet",
      genericSaltName: "Paracetamol (650mg)",
      manufacturer: "Micro Labs Ltd",
      packType: "Strip",
      tabletsPerStrip: 15,
      hsnCode: "30049060",
      rackLocation: "Rack B-04",
      minStockAlert: 20,
      scheduleType: "OTC",
      isScheduleH: false,
      batchNumber: "DL-6501",
      expiryDate: "11/2026",
      mrp: 34.00,
      purchaseRate: 22.00,
      saleRate: 30.60,
      stripQuantity: 80,
      looseTabletQuantity: 8,
      gstRate: 12.0,
      image_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80",
    },
  });

  const med3 = await prisma.medicine.create({
    data: {
      sku: "MED-PAND",
      barcode: "8902145698712",
      name: "Pan-D Capsule",
      genericSaltName: "Pantoprazole (40mg) + Domperidone (30mg)",
      manufacturer: "Alkem Laboratories Ltd",
      packType: "Strip",
      tabletsPerStrip: 15,
      hsnCode: "30049099",
      rackLocation: "Rack A-08",
      minStockAlert: 10,
      scheduleType: "SCHEDULE_H",
      isScheduleH: true,
      batchNumber: "PAND-3112",
      expiryDate: "03/2027",
      mrp: 210.00,
      purchaseRate: 145.00,
      saleRate: 189.00,
      stripQuantity: 28,
      looseTabletQuantity: 4,
      gstRate: 12.0,
      image_url: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&q=80",
    },
  });

  const med4 = await prisma.medicine.create({
    data: {
      sku: "MED-AZITH500",
      barcode: "8903344556677",
      name: "Azithral 500 Tablet",
      genericSaltName: "Azithromycin (500mg)",
      manufacturer: "Alembic Pharmaceuticals Ltd",
      packType: "Strip",
      tabletsPerStrip: 5,
      hsnCode: "30042099",
      rackLocation: "Rack C-02",
      minStockAlert: 12,
      scheduleType: "SCHEDULE_H",
      isScheduleH: true,
      batchNumber: "AZ-9901",
      expiryDate: "12/2026",
      mrp: 132.00,
      purchaseRate: 88.00,
      saleRate: 118.80,
      stripQuantity: 6,
      looseTabletQuantity: 0,
      gstRate: 12.0,
    },
  });

  const med5 = await prisma.medicine.create({
    data: {
      sku: "MED-ASCORIL",
      barcode: "8904455667788",
      name: "Ascoril D Plus Syrup (100ml)",
      genericSaltName: "Dextromethorphan + Phenylephrine + Chlorpheniramine",
      manufacturer: "Glenmark Pharmaceuticals Ltd",
      packType: "Bottle",
      tabletsPerStrip: 1,
      hsnCode: "30049099",
      rackLocation: "Rack S-05",
      minStockAlert: 8,
      scheduleType: "OTC",
      isScheduleH: false,
      batchNumber: "ASC-5541",
      expiryDate: "05/2026",
      mrp: 145.00,
      purchaseRate: 95.00,
      saleRate: 130.50,
      stripQuantity: 18,
      looseTabletQuantity: 0,
      gstRate: 12.0,
    },
  });

  const med6 = await prisma.medicine.create({
    data: {
      sku: "MED-BETADINE",
      barcode: "8905566778899",
      name: "Betadine 10% Ointment (20g)",
      genericSaltName: "Povidone Iodine (10% w/w)",
      manufacturer: "Win-Medicare Pvt Ltd",
      packType: "Ointment",
      tabletsPerStrip: 1,
      hsnCode: "30049099",
      rackLocation: "Rack O-01",
      minStockAlert: 10,
      scheduleType: "OTC",
      isScheduleH: false,
      batchNumber: "BT-2024",
      expiryDate: "10/2025",
      mrp: 110.00,
      purchaseRate: 70.00,
      saleRate: 99.00,
      stripQuantity: 3,
      looseTabletQuantity: 0,
      gstRate: 12.0,
    },
  });

  // 7. Order (1 record)
  const sampleOrder = await prisma.order.create({
    data: {
      bill_no: "RX-2026-0001",
      customerId: sampleCustomer.id,
      prescriptionId: samplePrescription.id,
      patientName: "Aarav Patel",
      doctorName: "Dr. Sandeep Deshmukh, MD",
      status: "COMPLETED",
      total_amount: 262.35, // 201.15 + (2 * 30.60)
      discount_amount: 15.00,
      tax_amount: 29.68,
      final_payable: 277.03,
      paid_amount: 277.03,
      balance_amount: 0,
      delivery_due_date: new Date(),
    },
  });

  // 8. Order Items
  await prisma.orderItem.create({
    data: {
      orderId: sampleOrder.id,
      medicineId: med1.id,
      batchNumber: "AUG-8492",
      expiryDate: "08/2027",
      packType: "Strip",
      unitType: "STRIP",
      quantity: 1,
      unit_price: 201.15,
      subtotal: 201.15,
      gstRate: 12.0,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: sampleOrder.id,
      medicineId: med2.id,
      batchNumber: "DL-6501",
      expiryDate: "11/2026",
      packType: "Strip",
      unitType: "STRIP",
      quantity: 2,
      unit_price: 30.60,
      subtotal: 61.20,
      gstRate: 12.0,
    },
  });

  // 9. Payment (1 record)
  await prisma.payment.create({
    data: {
      orderId: sampleOrder.id,
      method: "UPI",
      amount: 277.03,
      payment_type: "FULL",
      transaction_ref: "UPI/PAYTM/9820123456",
    },
  });

  console.log("✅ Seed completed successfully: PharmaPulse database initialized with sample medical inventory & prescriptions.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
