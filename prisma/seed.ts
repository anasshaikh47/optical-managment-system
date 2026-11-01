import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Optical POS & ERP Database Seeding...");

  // Clean existing data
  await prisma.payment.deleteMany();
  await prisma.labJob.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.optometrist.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.storeSetting.deleteMany();

  // 1. Store Settings
  const store = await prisma.storeSetting.create({
    data: {
      id: "default",
      storeName: "Lumina Vision & Optical Studio",
      tagline: "Clinical Precision • Bespoke Eyewear Craftsmanship",
      phone: "+1 (555) 382-7740",
      email: "hello@luminavisionstudio.com",
      address: "428 Park Avenue, Suite 12B, New York, NY 10022",
      taxNumber: "NY-OPT-948201",
      currencySymbol: "$",
      currencyCode: "USD",
      defaultTaxRate: 8.875,
      invoiceNotes:
        "Prescription lenses are tailored to your optical measurement. 12-month frame warranty covers manufacturing defects. Thank you for choosing Lumina Vision Studio!",
    },
  });

  // 2. Optometrists
  const opt1 = await prisma.optometrist.create({
    data: {
      name: "Dr. Elena Vance, OD",
      licenseNumber: "OD-94021-NY",
      phone: "+1 (555) 234-8899",
      email: "dr.vance@luminavisionstudio.com",
      active: true,
    },
  });

  const opt2 = await prisma.optometrist.create({
    data: {
      name: "Dr. Julian Thorne, OD, FAAO",
      licenseNumber: "OD-88123-NY",
      phone: "+1 (555) 441-9922",
      email: "dr.thorne@luminavisionstudio.com",
      active: true,
    },
  });

  // 3. Customers
  const customer1 = await prisma.customer.create({
    data: {
      customerCode: "CUST-1001",
      name: "Olivia Sterling",
      phone: "+1 (555) 912-3401",
      email: "olivia.sterling@example.com",
      gender: "Female",
      dob: new Date("1988-06-14"),
      address: "740 Lexington Ave, Apt 4B, New York, NY",
      occupation: "Architect & Creative Director",
      notes: "High prescription sensitivity; prefers ultra-light titanium frames and high-index 1.67 lenses.",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerCode: "CUST-1002",
      name: "Marcus Chen",
      phone: "+1 (555) 831-4502",
      email: "marcus.chen@techstartup.io",
      gender: "Male",
      dob: new Date("1994-11-22"),
      address: "120 Broadway, Fl 18, New York, NY",
      occupation: "Software Engineer",
      notes: "Severe digital eye fatigue from multiple screen setups. Strongly requires blue-light filtering.",
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      customerCode: "CUST-1003",
      name: "Sophia Martinez-Roy",
      phone: "+1 (555) 762-5603",
      email: "sophia.martinez@fashionagency.com",
      gender: "Female",
      dob: new Date("1996-03-30"),
      address: "550 Hudson St, New York, NY",
      occupation: "Brand Strategist",
      notes: "Wears daily contact lenses on weekdays and bold statement frames on weekends.",
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      customerCode: "CUST-1004",
      name: "Arthur Pendelton",
      phone: "+1 (555) 673-6704",
      email: "arthur.pendelton@lawcorp.com",
      gender: "Male",
      dob: new Date("1964-08-09"),
      address: "330 Riverside Dr, New York, NY",
      occupation: "Senior Legal Partner",
      notes: "First time progressive lens user. Requires wide reading corridor for document reviews.",
    },
  });

  const customer5 = await prisma.customer.create({
    data: {
      customerCode: "CUST-1005",
      name: "Chloe Bennett",
      phone: "+1 (555) 584-7805",
      email: "chloe.b@creativearts.edu",
      gender: "Female",
      dob: new Date("2002-01-18"),
      address: "22 8th Ave, Brooklyn, NY",
      occupation: "Graphic Designer",
      notes: "Prefers round vintage acetate frames.",
    },
  });

  // 4. Prescriptions
  const rx1 = await prisma.prescription.create({
    data: {
      prescriptionNo: "RX-2026-001",
      customerId: customer1.id,
      optometristId: opt1.id,
      // OD
      sphOd: -4.25,
      cylOd: -1.0,
      axisOd: 175,
      addOd: 1.5,
      vaOd: "20/20",
      pdOd: 31.0,
      // OS
      sphOs: -4.75,
      cylOs: -1.25,
      axisOs: 5,
      addOs: 1.5,
      vaOs: "20/20",
      pdOs: 31.5,
      pdTotal: 62.5,
      lensType: "Progressive High-Index",
      examDate: new Date("2026-10-15"),
      expiryDate: new Date("2028-10-15"),
      notes: "Recommended Essilor Crizal 1.67 with anti-reflective coating for night driving glare.",
    },
  });

  const rx2 = await prisma.prescription.create({
    data: {
      prescriptionNo: "RX-2026-002",
      customerId: customer2.id,
      optometristId: opt2.id,
      // OD
      sphOd: -1.5,
      cylOd: -0.5,
      axisOd: 90,
      addOd: 0.0,
      vaOd: "20/15",
      pdOd: 32.0,
      // OS
      sphOs: -1.75,
      cylOs: -0.5,
      axisOs: 95,
      addOs: 0.0,
      vaOs: "20/15",
      pdOs: 32.0,
      pdTotal: 64.0,
      lensType: "Single Vision Blue-Cut",
      examDate: new Date("2026-10-28"),
      expiryDate: new Date("2028-10-28"),
      notes: "Patient spends 10+ hours on OLED screens daily. Recommended Blue-Violet filter.",
    },
  });

  const rx3 = await prisma.prescription.create({
    data: {
      prescriptionNo: "RX-2026-003",
      customerId: customer4.id,
      optometristId: opt1.id,
      // OD
      sphOd: 1.25,
      cylOd: -0.75,
      axisOd: 80,
      addOd: 2.25,
      vaOd: "20/25",
      pdOd: 32.5,
      // OS
      sphOs: 1.5,
      cylOs: -0.5,
      axisOs: 100,
      addOs: 2.25,
      vaOs: "20/25",
      pdOs: 32.5,
      pdTotal: 65.0,
      lensType: "Progressive Freeform",
      examDate: new Date("2026-10-20"),
      expiryDate: new Date("2028-10-20"),
      notes: "Presbyopic correction with wide corridor progression. Avoid narrow frames.",
    },
  });

  // 5. Products Catalog
  const pFrames = [
    {
      sku: "FRM-RB-2140",
      barcode: "805289126577",
      name: "Ray-Ban Original Wayfarer Classic",
      category: "FRAME",
      brand: "Ray-Ban",
      modelNumber: "RB2140",
      color: "Polished Black",
      size: "50-22-150",
      material: "Acetate",
      shape: "Wayfarer",
      costPrice: 85.0,
      sellingPrice: 185.0,
      stockQuantity: 14,
      minStockAlert: 4,
      supplier: "Luxottica Group",
      description: "The timeless icon of eyewear with signature rivet hinges and ergonomic temple tips.",
    },
    {
      sku: "FRM-LIN-TITAN",
      barcode: "739281004123",
      name: "Lindberg Air Rimless Titanium",
      category: "FRAME",
      brand: "Lindberg",
      modelNumber: "Spirit Basic 2000",
      color: "Satin Gunmetal",
      size: "49-20-145",
      material: "Titanium",
      shape: "Oval Rimless",
      costPrice: 240.0,
      sellingPrice: 520.0,
      stockQuantity: 6,
      minStockAlert: 2,
      supplier: "Lindberg Denmark",
      description: "Featherlight 2.7g screwless titanium frame hand-crafted in Denmark.",
    },
    {
      sku: "FRM-TF-5401",
      barcode: "889652194821",
      name: "Tom Ford Classic Square Optical",
      category: "FRAME",
      brand: "Tom Ford",
      modelNumber: "FT5401-B",
      color: "Dark Havana / Gold 'T'",
      size: "51-20-145",
      material: "Acetate",
      shape: "Square",
      costPrice: 180.0,
      sellingPrice: 420.0,
      stockQuantity: 8,
      minStockAlert: 3,
      supplier: "Marcolin Eyewear",
      description: "Sophisticated luxury frame with signature metal T logo detailing on temple.",
    },
    {
      sku: "FRM-OK-8156",
      barcode: "888392439102",
      name: "Oakley Holbrook RX Optical",
      category: "FRAME",
      brand: "Oakley",
      modelNumber: "OX8156-01",
      color: "Matte Black",
      size: "56-18-137",
      material: "O-Matter",
      shape: "Rectangle",
      costPrice: 75.0,
      sellingPrice: 170.0,
      stockQuantity: 18,
      minStockAlert: 5,
      supplier: "Luxottica Group",
      description: "Ultra-durable lightweight O-Matter frame designed for active lifestyles.",
    },
    {
      sku: "FRM-GUC-0061",
      barcode: "805637628192",
      name: "Gucci Signature Round Havana",
      category: "FRAME",
      brand: "Gucci",
      modelNumber: "GG0061S",
      color: "Tortoiseshell / Gold",
      size: "52-20-140",
      material: "Acetate & Metal",
      shape: "Round",
      costPrice: 195.0,
      sellingPrice: 440.0,
      stockQuantity: 5,
      minStockAlert: 2,
      supplier: "Kering Eyewear",
      description: "Round vintage-inspired silhouette with interlocking G logo and web stripe temples.",
    },
    {
      sku: "FRM-VOG-5333",
      barcode: "805659720391",
      name: "Vogue Eyewear Chic Cat-Eye",
      category: "FRAME",
      brand: "Vogue",
      modelNumber: "VO5333",
      color: "Deep Burgundy Plum",
      size: "53-16-140",
      material: "Bio-Acetate",
      shape: "Cat-Eye",
      costPrice: 48.0,
      sellingPrice: 125.0,
      stockQuantity: 12,
      minStockAlert: 3,
      supplier: "Luxottica Group",
      description: "Feminine cat-eye profile crafted from sustainable bio-acetate.",
    },
  ];

  for (const item of pFrames) {
    await prisma.product.create({ data: item });
  }

  const pLenses = [
    {
      sku: "LNS-ESS-167-CRZ",
      name: "Essilor Crizal Sapphire HR 1.67 High-Index",
      category: "LENS",
      brand: "Essilor",
      lensIndex: "1.67",
      coating: "Crizal Sapphire HR (Anti-Glare + Blue-UV + Scratch Defense)",
      costPrice: 110.0,
      sellingPrice: 260.0,
      stockQuantity: 50,
      minStockAlert: 10,
      supplier: "Essilor International",
      description: "Ultra-thin high index lenses featuring 360-degree multi-angular anti-reflective tech.",
    },
    {
      sku: "LNS-ZEISS-PROG-160",
      name: "Zeiss DriveSafe Precision Progressive 1.60",
      category: "LENS",
      brand: "Zeiss",
      lensIndex: "1.60",
      coating: "DuraVision Platinum AR + DriveSafe Luminance",
      costPrice: 190.0,
      sellingPrice: 490.0,
      stockQuantity: 25,
      minStockAlert: 5,
      supplier: "Carl Zeiss Vision",
      description: "Freeform digital progressive lens optimized for night driving comfort and low light clarity.",
    },
    {
      sku: "LNS-HOYA-156-BLU",
      name: "Hoya BlueControl Single Vision 1.56",
      category: "LENS",
      brand: "Hoya",
      lensIndex: "1.56",
      coating: "Hi-Vision LongLife BlueControl",
      costPrice: 45.0,
      sellingPrice: 120.0,
      stockQuantity: 40,
      minStockAlert: 8,
      supplier: "Hoya Vision Care",
      description: "Neutralizes blue light emitted by digital screens to relieve eye fatigue.",
    },
    {
      sku: "LNS-TRANS-GEN8-160",
      name: "Transitions Gen S Signature 1.60 Photochromic",
      category: "LENS",
      brand: "Transitions",
      lensIndex: "1.60",
      coating: "Photochromic Graphite Green + Premium AR",
      costPrice: 95.0,
      sellingPrice: 230.0,
      stockQuantity: 30,
      minStockAlert: 6,
      supplier: "Transitions Optical",
      description: "Rapid activation under sunlight and returns to fully crystal clear indoors in seconds.",
    },
  ];

  for (const item of pLenses) {
    await prisma.product.create({ data: item });
  }

  const pContacts = [
    {
      sku: "CL-ACUVUE-OASYS-1D",
      barcode: "073390558190",
      name: "Acuvue Oasys 1-Day with HydraLuxe (30 pk)",
      category: "CONTACT_LENS",
      brand: "Johnson & Johnson",
      baseCurve: 8.5,
      diameter: 14.3,
      powerRange: "-0.50 to -12.00",
      costPrice: 22.0,
      sellingPrice: 44.0,
      stockQuantity: 45,
      minStockAlert: 10,
      supplier: "Johnson & Johnson Vision",
      description: "Tear-infused silicone hydrogel contact lenses for long days in air-conditioned spaces.",
    },
    {
      sku: "CL-AIR-OPTIX-HG",
      barcode: "084656608910",
      name: "Air Optix Plus HydraGlyde Monthly (6 pk)",
      category: "CONTACT_LENS",
      brand: "Alcon",
      baseCurve: 8.6,
      diameter: 14.2,
      powerRange: "+8.00 to -12.00",
      costPrice: 28.0,
      sellingPrice: 58.0,
      stockQuantity: 35,
      minStockAlert: 8,
      supplier: "Alcon Laboratories",
      description: "SmartShield Technology guards against irritating deposits all month long.",
    },
  ];

  for (const item of pContacts) {
    await prisma.product.create({ data: item });
  }

  const pAccessories = [
    {
      sku: "ACC-LUMINA-KIT",
      barcode: "890123847001",
      name: "Lumina Deluxe Lens Care & Anti-Fog Kit",
      category: "ACCESSORY",
      brand: "Lumina Vision",
      costPrice: 5.5,
      sellingPrice: 18.0,
      stockQuantity: 80,
      minStockAlert: 15,
      description: "Includes 60ml alcohol-free optical cleaner, microfiber cloth, and precision micro screwdriver.",
    },
    {
      sku: "ACC-LEATHER-CASE",
      barcode: "890123847002",
      name: "Handcrafted Italian Leather Eyewear Case",
      category: "ACCESSORY",
      brand: "Artigiano",
      color: "Vintage Cognac",
      costPrice: 12.0,
      sellingPrice: 35.0,
      stockQuantity: 24,
      minStockAlert: 5,
      description: "Rigid magnetic closure case with velvet interior lining to protect luxury frames.",
    },
  ];

  for (const item of pAccessories) {
    await prisma.product.create({ data: item });
  }

  // 6. Orders, Order Items, Payments & Lab Jobs
  const frameLindberg = await prisma.product.findUnique({ where: { sku: "FRM-LIN-TITAN" } });
  const lensEssilor = await prisma.product.findUnique({ where: { sku: "LNS-ESS-167-CRZ" } });
  const careKit = await prisma.product.findUnique({ where: { sku: "ACC-LUMINA-KIT" } });
  const frameRayban = await prisma.product.findUnique({ where: { sku: "FRM-RB-2140" } });
  const lensHoya = await prisma.product.findUnique({ where: { sku: "LNS-HOYA-156-BLU" } });
  const contactAcuvue = await prisma.product.findUnique({ where: { sku: "CL-ACUVUE-OASYS-1D" } });

  // Order 1: Custom Prescription Eyeglasses for Olivia Sterling
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-0001",
      customerId: customer1.id,
      prescriptionId: rx1.id,
      orderType: "PRESCRIPTION_SPECS",
      status: "IN_LAB",
      paymentStatus: "PARTIAL",
      subtotal: 798.0,
      discount: 40.0,
      taxRate: 8.875,
      taxAmount: 67.27,
      totalAmount: 825.27,
      paidAmount: 500.0,
      balanceAmount: 325.27,
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days ahead
      notes: "Custom bevel for rimless titanium mounting. Patient requested priority rush service.",
      items: {
        create: [
          {
            productId: frameLindberg?.id,
            itemName: "Lindberg Air Rimless Titanium (Spirit Basic 2000)",
            category: "FRAME",
            unitPrice: 520.0,
            quantity: 1,
            discount: 20.0,
            totalPrice: 500.0,
            customDetails: "Grooved rimless mount, 49 eye size, temple length 145mm.",
          },
          {
            productId: lensEssilor?.id,
            itemName: "Essilor Crizal Sapphire HR 1.67 (Pair)",
            category: "LENS",
            unitPrice: 260.0,
            quantity: 1,
            discount: 20.0,
            totalPrice: 240.0,
            customDetails: "High-index 1.67, polished edges for rimless aesthetic, Crizal AR.",
          },
          {
            productId: careKit?.id,
            itemName: "Lumina Deluxe Lens Care & Anti-Fog Kit",
            category: "ACCESSORY",
            unitPrice: 18.0,
            quantity: 1,
            discount: 0,
            totalPrice: 18.0,
          },
        ],
      },
      payments: {
        create: [
          {
            paymentNo: "PAY-2026-0001",
            amount: 500.0,
            paymentMethod: "CARD",
            referenceNo: "AUTH-VISA-9921",
            notes: "Initial deposit paid at time of order placement.",
          },
        ],
      },
      labJob: {
        create: {
          jobNo: "LAB-2026-001",
          labType: "IN_HOUSE",
          labName: "Lumina Master Glazing Workshop",
          technicianName: "Carlos Ramirez",
          status: "IN_WORKSHOP",
          cost: 45.0,
          lensDetails: "OD: -4.25/-1.00x175 | OS: -4.75/-1.25x005 | Index: 1.67 | PD: 31/31.5",
          frameDetails: "Lindberg Rimless Spirit 2000 (Satin Gunmetal)",
          instructions: "Precision diamond drill for Lindberg clip pins. Edge polish grade A.",
          sentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Order 2: Marcus Chen - Blue Light Spectacles (Ready for Pickup)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-0002",
      customerId: customer2.id,
      prescriptionId: rx2.id,
      orderType: "PRESCRIPTION_SPECS",
      status: "READY_FOR_PICKUP",
      paymentStatus: "PAID",
      subtotal: 305.0,
      discount: 20.0,
      taxRate: 8.875,
      taxAmount: 25.29,
      totalAmount: 310.29,
      paidAmount: 310.29,
      balanceAmount: 0.0,
      deliveryDate: new Date(),
      notes: "Fully fitted and verified against lensometer standards. Ready for customer pickup.",
      items: {
        create: [
          {
            productId: frameRayban?.id,
            itemName: "Ray-Ban Original Wayfarer Classic (Polished Black)",
            category: "FRAME",
            unitPrice: 185.0,
            quantity: 1,
            discount: 10.0,
            totalPrice: 175.0,
          },
          {
            productId: lensHoya?.id,
            itemName: "Hoya BlueControl Single Vision 1.56 (Pair)",
            category: "LENS",
            unitPrice: 120.0,
            quantity: 1,
            discount: 10.0,
            totalPrice: 110.0,
          },
        ],
      },
      payments: {
        create: [
          {
            paymentNo: "PAY-2026-0002",
            amount: 310.29,
            paymentMethod: "UPI",
            referenceNo: "UPI-APPLE-98104",
            notes: "Full payment completed online.",
          },
        ],
      },
      labJob: {
        create: {
          jobNo: "LAB-2026-002",
          labType: "IN_HOUSE",
          labName: "Lumina Master Glazing Workshop",
          technicianName: "Sarah Connor",
          status: "QA_PASSED",
          cost: 25.0,
          lensDetails: "OD: -1.50/-0.50x90 | OS: -1.75/-0.50x95 | Index 1.56 BlueControl",
          frameDetails: "Ray-Ban RB2140 Wayfarer",
          instructions: "Standard full-rim edging. Verify optical center aligns with PD 64.",
          sentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          dueDate: new Date(),
          completedDate: new Date(),
        },
      },
    },
  });

  // Order 3: Sophia Martinez-Roy - Contact Lens Refill + Accessories (Completed)
  await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-0003",
      customerId: customer3.id,
      orderType: "CONTACT_LENS",
      status: "COMPLETED",
      paymentStatus: "PAID",
      subtotal: 106.0,
      discount: 10.0,
      taxRate: 8.875,
      taxAmount: 8.52,
      totalAmount: 104.52,
      paidAmount: 104.52,
      balanceAmount: 0.0,
      deliveryDate: new Date(),
      notes: "Immediate counter sale.",
      items: {
        create: [
          {
            productId: contactAcuvue?.id,
            itemName: "Acuvue Oasys 1-Day with HydraLuxe (30 pk)",
            category: "CONTACT_LENS",
            unitPrice: 44.0,
            quantity: 2,
            discount: 10.0,
            totalPrice: 78.0,
          },
          {
            productId: careKit?.id,
            itemName: "Lumina Deluxe Lens Care & Anti-Fog Kit",
            category: "ACCESSORY",
            unitPrice: 18.0,
            quantity: 1,
            discount: 0,
            totalPrice: 18.0,
          },
        ],
      },
      payments: {
        create: [
          {
            paymentNo: "PAY-2026-0003",
            amount: 104.52,
            paymentMethod: "CARD",
            referenceNo: "AUTH-AMEX-4412",
            notes: "Paid via Tap-to-Pay Amex.",
          },
        ],
      },
    },
  });

  // 7. Appointments
  const today = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.appointment.createMany({
    data: [
      {
        customerId: customer1.id,
        optometristId: opt1.id,
        appointmentDate: today,
        appointmentTime: "10:30 AM",
        type: "EYE_EXAM",
        status: "CONFIRMED",
        notes: "Annual retinal scan and progressive lens checkup.",
      },
      {
        customerId: customer2.id,
        optometristId: opt2.id,
        appointmentDate: today,
        appointmentTime: "02:00 PM",
        type: "FRAME_SELECTION",
        status: "SCHEDULED",
        notes: "Pickup ready glasses and personalized nosepad adjustment.",
      },
      {
        customerId: customer3.id,
        optometristId: opt1.id,
        appointmentDate: tomorrow,
        appointmentTime: "11:15 AM",
        type: "CONTACT_LENS_FITTING",
        status: "SCHEDULED",
        notes: "Trialing new toric daily contact lenses.",
      },
      {
        customerId: customer5.id,
        optometristId: opt2.id,
        appointmentDate: tomorrow,
        appointmentTime: "03:45 PM",
        type: "EYE_EXAM",
        status: "SCHEDULED",
        notes: "First time consultation for headache complaints.",
      },
    ],
  });

  console.log("✅ Optical Store database successfully seeded with realistic clinical & retail records!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
