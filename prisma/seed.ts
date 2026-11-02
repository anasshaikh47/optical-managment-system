import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting VisionPulse Optical ERP & POS Database Seeding...");

  // Clear existing records in correct order
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeSetting.deleteMany();

  // 1. Store Setting
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

  // 2. Users (Owner & Staff)
  const userOwner = await prisma.user.create({
    data: {
      name: "Rajesh Sharma",
      email: "rajesh@visionpulse.in",
      role: "OWNER",
      pin_hash: "1234", // Simple quick PIN for POS register login
    },
  });

  const userStaff = await prisma.user.create({
    data: {
      name: "Priya Nair, M.Opt",
      email: "priya@visionpulse.in",
      role: "STAFF",
      pin_hash: "5678",
    },
  });

  const userTech = await prisma.user.create({
    data: {
      name: "Amit Verma",
      email: "amit.workshop@visionpulse.in",
      role: "STAFF",
      pin_hash: "4321",
    },
  });

  console.log("👤 Created 3 Users (Owner, Optometrist, Workshop Glazier)");

  // 3. Ten Indian Customers with phone numbers
  const customersData = [
    {
      name: "Aarav Patel",
      phone: "+91 98201 23456",
      email: "aarav.patel@gmail.com",
      address: "A-402, Sea Green Apts, Juhu Tara Road, Andheri West, Mumbai - 400049",
      dob: new Date("1991-04-12"),
      loyalty_points: 120,
    },
    {
      name: "Diya Sundaram",
      phone: "+91 98450 34567",
      email: "diya.sundaram@yahoo.co.in",
      address: "14/2, 100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru - 560038",
      dob: new Date("1996-08-25"),
      loyalty_points: 250,
    },
    {
      name: "Rohan Mukherjee",
      phone: "+91 98300 45678",
      email: "rohan.m@techcorp.in",
      address: "Block CF-18, Sector 1, Salt Lake City, Kolkata - 700064",
      dob: new Date("1968-11-03"),
      loyalty_points: 80,
    },
    {
      name: "Ananya Deshmukh",
      phone: "+91 98220 56789",
      email: "ananya.deshmukh@outlook.com",
      address: "Flat 301, Mayur Nagari, Paud Road, Kothrud, Pune - 411038",
      dob: new Date("1994-02-17"),
      loyalty_points: 310,
    },
    {
      name: "Vikramaditya Singh",
      phone: "+91 98110 67890",
      email: "vikram.singh@delhicorp.com",
      address: "C-8, Poorvi Marg, Vasant Vihar, New Delhi - 110057",
      dob: new Date("1975-06-30"),
      loyalty_points: 190,
    },
    {
      name: "Meera Krishnan",
      phone: "+91 94440 78901",
      email: "meera.k@chennaimail.com",
      address: "24, North Boag Road, T. Nagar, Chennai - 600017",
      dob: new Date("2000-09-14"),
      loyalty_points: 150,
    },
    {
      name: "Kabir Malhotra",
      phone: "+91 98140 89012",
      email: "kabir.m@chandigarh.org",
      address: "House 512, Sector 18-B, Chandigarh - 160018",
      dob: new Date("1998-12-05"),
      loyalty_points: 50,
    },
    {
      name: "Neha Reddy",
      phone: "+91 98490 90123",
      email: "neha.reddy@hyderabadit.com",
      address: "Road No. 12, MLA Colony, Banjara Hills, Hyderabad - 500034",
      dob: new Date("1993-07-22"),
      loyalty_points: 220,
    },
    {
      name: "Siddharth Joshi",
      phone: "+91 98250 01234",
      email: "siddharth.j@gujaratbiz.com",
      address: "7, Swastik Society, CG Road, Navrangpura, Ahmedabad - 380009",
      dob: new Date("1989-01-19"),
      loyalty_points: 95,
    },
    {
      name: "Pooja Iyer",
      phone: "+91 98950 12345",
      email: "pooja.iyer@keralaoptics.in",
      address: "Green Valley Villa, Main Avenue, Panampilly Nagar, Kochi - 682036",
      dob: new Date("1995-10-10"),
      loyalty_points: 180,
    },
  ];

  const createdCustomers: any[] = [];
  for (const c of customersData) {
    const cust = await prisma.customer.create({ data: c });
    createdCustomers.push(cust);
  }
  console.log(`👥 Created ${createdCustomers.length} Indian Customers with unique verified phones`);

  // 4. Optical Prescriptions with OD/OS values (SPH, CYL, AXIS, ADD, PD)
  const rx1 = await prisma.prescription.create({
    data: {
      customerId: createdCustomers[0].id, // Aarav Patel
      optometristName: "Dr. Priya Nair, M.Opt",
      od_sph: -3.75,
      od_cyl: -1.0,
      od_axis: 175,
      od_add: null,
      os_sph: -4.25,
      os_cyl: -1.25,
      os_axis: 5,
      os_add: null,
      pd_distance: 63.0,
      pd_near: 60.0,
      lens_type: "BLUE_CUT",
      notes: "High myopia with astigmatism. Recommend 1.67 high-index lens with hydrophobic anti-glare.",
    },
  });

  const rx2 = await prisma.prescription.create({
    data: {
      customerId: createdCustomers[1].id, // Diya Sundaram
      optometristName: "Dr. Priya Nair, M.Opt",
      od_sph: -1.5,
      od_cyl: -0.5,
      od_axis: 90,
      od_add: null,
      os_sph: -1.75,
      os_cyl: -0.5,
      os_axis: 95,
      os_add: null,
      pd_distance: 62.0,
      pd_near: 59.5,
      lens_type: "BLUE_CUT",
      notes: "Severe computer vision syndrome complaints. Blue-cut filter with anti-reflective coating.",
    },
  });

  const rx3 = await prisma.prescription.create({
    data: {
      customerId: createdCustomers[2].id, // Rohan Mukherjee
      optometristName: "Dr. S. K. Bose, MS (Ophth)",
      od_sph: 1.25,
      od_cyl: -0.5,
      od_axis: 80,
      od_add: 2.0,
      os_sph: 1.5,
      os_cyl: -0.75,
      os_axis: 100,
      os_add: 2.0,
      pd_distance: 65.0,
      pd_near: 61.5,
      lens_type: "PROGRESSIVE",
      notes: "Presbyopic digital progressive. Wide intermediate channel for reading and laptop work.",
    },
  });

  const rx4 = await prisma.prescription.create({
    data: {
      customerId: createdCustomers[3].id, // Ananya Deshmukh
      optometristName: "Dr. Priya Nair, M.Opt",
      od_sph: -0.75,
      od_cyl: -0.5,
      od_axis: 180,
      od_add: null,
      os_sph: -1.0,
      os_cyl: -0.5,
      os_axis: 170,
      os_add: null,
      pd_distance: 61.5,
      pd_near: 58.0,
      lens_type: "SINGLE_VISION",
      notes: "Mild distance correction. Standard hard-coat anti-reflective.",
    },
  });

  const rx5 = await prisma.prescription.create({
    data: {
      customerId: createdCustomers[4].id, // Vikramaditya Singh
      optometristName: "Dr. Priya Nair, M.Opt",
      od_sph: -4.5,
      od_cyl: -1.5,
      od_axis: 90,
      od_add: 2.25,
      os_sph: -4.0,
      os_cyl: -1.25,
      os_axis: 85,
      os_add: 2.25,
      pd_distance: 66.0,
      pd_near: 62.5,
      lens_type: "PHOTOCHROMIC",
      notes: "Outdoor sunlight sensitivity. High index 1.67 Transitions Gen-S recommended.",
    },
  });

  const rx8 = await prisma.prescription.create({
    data: {
      customerId: createdCustomers[7].id, // Neha Reddy
      optometristName: "Dr. Priya Nair, M.Opt",
      od_sph: -2.25,
      od_cyl: 0.0,
      od_axis: null,
      od_add: null,
      os_sph: -2.5,
      os_cyl: -0.25,
      os_axis: 180,
      os_add: null,
      pd_distance: 62.5,
      pd_near: 59.5,
      lens_type: "SINGLE_VISION",
      notes: "Distance driving specs.",
    },
  });

  console.log("👓 Created Prescriptions with exact clinical OD/OS Diopters and PD values");

  // 5. Fifteen Inventory Items (Frames, Lenses, Contact Lens, Accessories)
  const inventoryItemsData = [
    // Frames (Ray-Ban, Titan Eye+, Fastrack, Vogue, Oakley)
    {
      sku: "FRM-RB-2140",
      barcode: "805289126577",
      type: "FRAME",
      brand: "Ray-Ban",
      model: "RB2140 Original Wayfarer",
      color: "Polished Black",
      size: "50-22-150",
      lens_index: null,
      cost_price: 4500.0,
      selling_price: 8900.0,
      gst_rate: 12.0,
      stock_quantity: 12,
      min_alert_threshold: 3,
      image_url: "/images/rayban-wayfarer.png",
    },
    {
      sku: "FRM-RB-3025",
      barcode: "805289600145",
      type: "FRAME",
      brand: "Ray-Ban",
      model: "RB3025 Classic Aviator Optical",
      color: "Arista Gold",
      size: "55-14-135",
      lens_index: null,
      cost_price: 4800.0,
      selling_price: 9500.0,
      gst_rate: 12.0,
      stock_quantity: 8,
      min_alert_threshold: 2,
      image_url: "/images/rayban-aviator.png",
    },
    {
      sku: "FRM-TITAN-EDGE",
      barcode: "890512349011",
      type: "FRAME",
      brand: "Titan Eye+",
      model: "Titan Edge Ultra-Slim Titanium",
      color: "Matte Gunmetal",
      size: "51-19-142",
      lens_index: null,
      cost_price: 2200.0,
      selling_price: 4999.0,
      gst_rate: 12.0,
      stock_quantity: 15,
      min_alert_threshold: 4,
      image_url: "/images/titan-edge.png",
    },
    {
      sku: "FRM-TITAN-FLEX",
      barcode: "890512349028",
      type: "FRAME",
      brand: "Titan Eye+",
      model: "Titan PureFlex Shape-Memory Alloy",
      color: "Midnight Blue",
      size: "53-17-140",
      lens_index: null,
      cost_price: 1800.0,
      selling_price: 3899.0,
      gst_rate: 12.0,
      stock_quantity: 18,
      min_alert_threshold: 5,
      image_url: "/images/titan-flex.png",
    },
    {
      sku: "FRM-FST-CHROME",
      barcode: "890712390123",
      type: "FRAME",
      brand: "Fastrack",
      model: "Fastrack Sport Rimless Semi-Wrap",
      color: "Silver Chrome",
      size: "54-18-138",
      lens_index: null,
      cost_price: 950.0,
      selling_price: 2199.0,
      gst_rate: 12.0,
      stock_quantity: 25,
      min_alert_threshold: 6,
      image_url: "/images/fastrack-chrome.png",
    },
    {
      sku: "FRM-FST-ACETATE",
      barcode: "890712390456",
      type: "FRAME",
      brand: "Fastrack",
      model: "Fastrack Vintage Round Acetate",
      color: "Amber Tortoise",
      size: "49-21-140",
      lens_index: null,
      cost_price: 800.0,
      selling_price: 1899.0,
      gst_rate: 12.0,
      stock_quantity: 20,
      min_alert_threshold: 5,
      image_url: "/images/fastrack-vintage.png",
    },
    {
      sku: "FRM-VOG-5333",
      barcode: "805659720391",
      type: "FRAME",
      brand: "Vogue Eyewear",
      model: "VO5333 Chic Cat-Eye Silhouette",
      color: "Burgundy Plum",
      size: "52-16-140",
      lens_index: null,
      cost_price: 2800.0,
      selling_price: 5990.0,
      gst_rate: 12.0,
      stock_quantity: 10,
      min_alert_threshold: 3,
      image_url: "/images/vogue-cateye.png",
    },
    {
      sku: "FRM-OKL-PITCH",
      barcode: "888392439102",
      type: "FRAME",
      brand: "Oakley",
      model: "Crosslink Pitch O-Matter Active",
      color: "Satin Black / Red Logo",
      size: "56-18-140",
      lens_index: null,
      cost_price: 4200.0,
      selling_price: 8290.0,
      gst_rate: 12.0,
      stock_quantity: 9,
      min_alert_threshold: 2,
      image_url: "/images/oakley-pitch.png",
    },
    {
      sku: "FRM-LINDBERG-AIR",
      barcode: "739281004123",
      type: "FRAME",
      brand: "Lindberg",
      model: "Spirit Basic 2000 Screwless Titanium",
      color: "Satin Graphite",
      size: "50-20-145",
      lens_index: null,
      cost_price: 14000.0,
      selling_price: 28500.0,
      gst_rate: 12.0,
      stock_quantity: 4,
      min_alert_threshold: 1,
      image_url: "/images/lindberg-titanium.png",
    },

    // Power Lenses (Essilor, Zeiss, Hoya, Transitions)
    {
      sku: "LNS-ESS-CRIZAL-167",
      barcode: "389201948210",
      type: "LENS",
      brand: "Essilor",
      model: "Crizal Sapphire HR 1.67 Aspheric",
      color: "Clear / 360 AR Blue-UV",
      size: "Pair",
      lens_index: "1.67",
      cost_price: 2100.0,
      selling_price: 4800.0,
      gst_rate: 12.0,
      stock_quantity: 40,
      min_alert_threshold: 8,
      image_url: "/images/essilor-crizal.png",
    },
    {
      sku: "LNS-ZEISS-CLEARVIEW",
      barcode: "404786529102",
      type: "LENS",
      brand: "Carl Zeiss",
      model: "ClearView Freeform 1.60 BlueGuard DuraVision",
      color: "Clear DuraVision Platinum",
      size: "Pair",
      lens_index: "1.60",
      cost_price: 2600.0,
      selling_price: 5900.0,
      gst_rate: 12.0,
      stock_quantity: 30,
      min_alert_threshold: 6,
      image_url: "/images/zeiss-clearview.png",
    },
    {
      sku: "LNS-HOYA-BLU-156",
      barcode: "497584910293",
      type: "LENS",
      brand: "Hoya",
      model: "Hi-Vision LongLife BlueControl 1.56",
      color: "Screen Blue Protection",
      size: "Pair",
      lens_index: "1.56",
      cost_price: 1100.0,
      selling_price: 2600.0,
      gst_rate: 12.0,
      stock_quantity: 50,
      min_alert_threshold: 10,
      image_url: "/images/hoya-blue.png",
    },
    {
      sku: "LNS-TRANS-GENS-160",
      barcode: "084656608910",
      type: "LENS",
      brand: "Transitions",
      model: "Transitions Gen-S Signature 1.60",
      color: "Graphite Grey Photochromic",
      size: "Pair",
      lens_index: "1.60",
      cost_price: 3200.0,
      selling_price: 6800.0,
      gst_rate: 12.0,
      stock_quantity: 22,
      min_alert_threshold: 5,
      image_url: "/images/transitions-gens.png",
    },
    {
      sku: "LNS-VP-STD-AR-150",
      barcode: "890888999101",
      type: "LENS",
      brand: "VisionPulse",
      model: "Standard CR-39 Anti-Glare Green AR",
      color: "Clear Hard Coat",
      size: "Pair",
      lens_index: "1.50",
      cost_price: 400.0,
      selling_price: 1200.0,
      gst_rate: 12.0,
      stock_quantity: 75,
      min_alert_threshold: 15,
      image_url: "/images/visionpulse-standard.png",
    },

    // Contact Lenses & Accessories
    {
      sku: "CL-BAUSCH-BIOTRUE",
      barcode: "078581029381",
      type: "CONTACT_LENS",
      brand: "Bausch & Lomb",
      model: "Biotrue ONEday Disposable (Pack of 30)",
      color: "Clear Handling Tint",
      size: "BC 8.6 / Dia 14.2",
      lens_index: null,
      cost_price: 1100.0,
      selling_price: 2100.0,
      gst_rate: 12.0,
      stock_quantity: 35,
      min_alert_threshold: 8,
      image_url: "/images/bausch-biotrue.png",
    },
  ];

  const itemsMap: Record<string, any> = {};
  for (const item of inventoryItemsData) {
    const created = await prisma.inventoryItem.create({ data: item });
    itemsMap[item.sku] = created;
  }
  console.log(`📦 Created ${Object.keys(itemsMap).length} Inventory Items (Frames, Lenses, Contact Lenses)`);

  // 6. Eight Active Orders in Various Tracking Statuses
  // Statuses: 'PLACED' | 'LENS_PROCESSING' | 'FITTING' | 'READY_FOR_PICKUP' | 'DELIVERED' | 'CANCELLED'

  // Order 1: Aarav Patel - FITTING status (Ray-Ban Wayfarer + Essilor 1.67 lens)
  const o1Total = itemsMap["FRM-RB-2140"].selling_price + itemsMap["LNS-ESS-CRIZAL-167"].selling_price; // 8900 + 4800 = 13700
  const o1Discount = 700.0;
  const o1Tax = ((o1Total - o1Discount) * 0.12); // 13000 * 0.12 = 1560
  const o1Final = o1Total - o1Discount + o1Tax; // 14560
  const o1Paid = 8000.0;
  const o1Balance = o1Final - o1Paid;

  const order1 = await prisma.order.create({
    data: {
      bill_no: "VP-2026-0001",
      customerId: createdCustomers[0].id,
      prescriptionId: rx1.id,
      status: "FITTING",
      total_amount: o1Total,
      discount_amount: o1Discount,
      tax_amount: o1Tax,
      final_payable: o1Final,
      paid_amount: o1Paid,
      balance_amount: o1Balance,
      delivery_due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            itemId: itemsMap["FRM-RB-2140"].id,
            quantity: 1,
            unit_price: itemsMap["FRM-RB-2140"].selling_price,
            coating_charges: 0,
            fitting_charges: 0,
            subtotal: itemsMap["FRM-RB-2140"].selling_price,
          },
          {
            itemId: itemsMap["LNS-ESS-CRIZAL-167"].id,
            quantity: 1,
            unit_price: itemsMap["LNS-ESS-CRIZAL-167"].selling_price,
            coating_charges: 0,
            fitting_charges: 300,
            subtotal: itemsMap["LNS-ESS-CRIZAL-167"].selling_price + 300,
          },
        ],
      },
      payments: {
        create: [
          {
            method: "UPI",
            amount: o1Paid,
            payment_type: "ADVANCE",
            transaction_ref: "UPI/261011892044/GPay",
          },
        ],
      },
    },
  });

  // Order 2: Diya Sundaram - READY_FOR_PICKUP (Titan Edge + Hoya BlueControl)
  const o2Total = itemsMap["FRM-TITAN-EDGE"].selling_price + itemsMap["LNS-HOYA-BLU-156"].selling_price; // 4999 + 2600 = 7599
  const o2Discount = 599.0;
  const o2Tax = ((o2Total - o2Discount) * 0.12); // 7000 * 0.12 = 840
  const o2Final = o2Total - o2Discount + o2Tax; // 7840
  const o2Paid = 4000.0;
  const o2Balance = o2Final - o2Paid;

  await prisma.order.create({
    data: {
      bill_no: "VP-2026-0002",
      customerId: createdCustomers[1].id,
      prescriptionId: rx2.id,
      status: "READY_FOR_PICKUP",
      total_amount: o2Total,
      discount_amount: o2Discount,
      tax_amount: o2Tax,
      final_payable: o2Final,
      paid_amount: o2Paid,
      balance_amount: o2Balance,
      delivery_due_date: new Date(),
      items: {
        create: [
          {
            itemId: itemsMap["FRM-TITAN-EDGE"].id,
            quantity: 1,
            unit_price: itemsMap["FRM-TITAN-EDGE"].selling_price,
            coating_charges: 0,
            fitting_charges: 0,
            subtotal: itemsMap["FRM-TITAN-EDGE"].selling_price,
          },
          {
            itemId: itemsMap["LNS-HOYA-BLU-156"].id,
            quantity: 1,
            unit_price: itemsMap["LNS-HOYA-BLU-156"].selling_price,
            coating_charges: 0,
            fitting_charges: 200,
            subtotal: itemsMap["LNS-HOYA-BLU-156"].selling_price + 200,
          },
        ],
      },
      payments: {
        create: [
          {
            method: "CARD",
            amount: o2Paid,
            payment_type: "ADVANCE",
            transaction_ref: "HDFC-POS-89102",
          },
        ],
      },
    },
  });

  // Order 3: Rohan Mukherjee - LENS_PROCESSING (Titan PureFlex + Zeiss ClearView Progressive)
  const o3Total = itemsMap["FRM-TITAN-FLEX"].selling_price + itemsMap["LNS-ZEISS-CLEARVIEW"].selling_price; // 3899 + 5900 = 9799
  const o3Discount = 799.0;
  const o3Tax = (o3Total - o3Discount) * 0.12; // 9000 * 0.12 = 1080
  const o3Final = o3Total - o3Discount + o3Tax; // 10080
  const o3Paid = 5000.0;
  const o3Balance = o3Final - o3Paid;

  await prisma.order.create({
    data: {
      bill_no: "VP-2026-0003",
      customerId: createdCustomers[2].id,
      prescriptionId: rx3.id,
      status: "LENS_PROCESSING",
      total_amount: o3Total,
      discount_amount: o3Discount,
      tax_amount: o3Tax,
      final_payable: o3Final,
      paid_amount: o3Paid,
      balance_amount: o3Balance,
      delivery_due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            itemId: itemsMap["FRM-TITAN-FLEX"].id,
            quantity: 1,
            unit_price: itemsMap["FRM-TITAN-FLEX"].selling_price,
            coating_charges: 0,
            fitting_charges: 0,
            subtotal: itemsMap["FRM-TITAN-FLEX"].selling_price,
          },
          {
            itemId: itemsMap["LNS-ZEISS-CLEARVIEW"].id,
            quantity: 1,
            unit_price: itemsMap["LNS-ZEISS-CLEARVIEW"].selling_price,
            coating_charges: 500,
            fitting_charges: 300,
            subtotal: itemsMap["LNS-ZEISS-CLEARVIEW"].selling_price + 800,
          },
        ],
      },
      payments: {
        create: [
          {
            method: "CARD",
            amount: o3Paid,
            payment_type: "ADVANCE",
            transaction_ref: "ICICI-VISA-3391",
          },
        ],
      },
    },
  });

  // Order 4: Ananya Deshmukh - DELIVERED (Vogue Cat-Eye + Standard AR)
  const o4Total = itemsMap["FRM-VOG-5333"].selling_price + itemsMap["LNS-VP-STD-AR-150"].selling_price; // 5990 + 1200 = 7190
  const o4Discount = 490.0;
  const o4Tax = (o4Total - o4Discount) * 0.12; // 6700 * 0.12 = 804
  const o4Final = o4Total - o4Discount + o4Tax; // 7504

  await prisma.order.create({
    data: {
      bill_no: "VP-2026-0004",
      customerId: createdCustomers[3].id,
      prescriptionId: rx4.id,
      status: "DELIVERED",
      total_amount: o4Total,
      discount_amount: o4Discount,
      tax_amount: o4Tax,
      final_payable: o4Final,
      paid_amount: o4Final,
      balance_amount: 0,
      delivery_due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            itemId: itemsMap["FRM-VOG-5333"].id,
            quantity: 1,
            unit_price: itemsMap["FRM-VOG-5333"].selling_price,
            coating_charges: 0,
            fitting_charges: 0,
            subtotal: itemsMap["FRM-VOG-5333"].selling_price,
          },
          {
            itemId: itemsMap["LNS-VP-STD-AR-150"].id,
            quantity: 1,
            unit_price: itemsMap["LNS-VP-STD-AR-150"].selling_price,
            coating_charges: 0,
            fitting_charges: 200,
            subtotal: itemsMap["LNS-VP-STD-AR-150"].selling_price + 200,
          },
        ],
      },
      payments: {
        create: [
          {
            method: "UPI",
            amount: 4000.0,
            payment_type: "ADVANCE",
            transaction_ref: "UPI/261005119022/PhonePe",
          },
          {
            method: "UPI",
            amount: o4Final - 4000.0,
            payment_type: "BALANCE",
            transaction_ref: "UPI/261008129033/PhonePe",
          },
        ],
      },
    },
  });

  // Order 5: Vikramaditya Singh - PLACED (Lindberg Titanium + Transitions Gen-S)
  const o5Total = itemsMap["FRM-LINDBERG-AIR"].selling_price + itemsMap["LNS-TRANS-GENS-160"].selling_price; // 28500 + 6800 = 35300
  const o5Discount = 2300.0;
  const o5Tax = (o5Total - o5Discount) * 0.12; // 33000 * 0.12 = 3960
  const o5Final = o5Total - o5Discount + o5Tax; // 36960
  const o5Paid = 20000.0;
  const o5Balance = o5Final - o5Paid;

  await prisma.order.create({
    data: {
      bill_no: "VP-2026-0005",
      customerId: createdCustomers[4].id,
      prescriptionId: rx5.id,
      status: "PLACED",
      total_amount: o5Total,
      discount_amount: o5Discount,
      tax_amount: o5Tax,
      final_payable: o5Final,
      paid_amount: o5Paid,
      balance_amount: o5Balance,
      delivery_due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            itemId: itemsMap["FRM-LINDBERG-AIR"].id,
            quantity: 1,
            unit_price: itemsMap["FRM-LINDBERG-AIR"].selling_price,
            coating_charges: 0,
            fitting_charges: 0,
            subtotal: itemsMap["FRM-LINDBERG-AIR"].selling_price,
          },
          {
            itemId: itemsMap["LNS-TRANS-GENS-160"].id,
            quantity: 1,
            unit_price: itemsMap["LNS-TRANS-GENS-160"].selling_price,
            coating_charges: 600,
            fitting_charges: 500,
            subtotal: itemsMap["LNS-TRANS-GENS-160"].selling_price + 1100,
          },
        ],
      },
      payments: {
        create: [
          {
            method: "CARD",
            amount: o5Paid,
            payment_type: "ADVANCE",
            transaction_ref: "AMEX-PLAT-9901",
          },
        ],
      },
    },
  });

  // Order 6: Meera Krishnan - DELIVERED (Contact Lenses x2)
  const o6Total = itemsMap["CL-BAUSCH-BIOTRUE"].selling_price * 2; // 2100 * 2 = 4200
  const o6Discount = 200.0;
  const o6Tax = (o6Total - o6Discount) * 0.12; // 4000 * 0.12 = 480
  const o6Final = o6Total - o6Discount + o6Tax; // 4480

  await prisma.order.create({
    data: {
      bill_no: "VP-2026-0006",
      customerId: createdCustomers[5].id,
      prescriptionId: null,
      status: "DELIVERED",
      total_amount: o6Total,
      discount_amount: o6Discount,
      tax_amount: o6Tax,
      final_payable: o6Final,
      paid_amount: o6Final,
      balance_amount: 0,
      delivery_due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            itemId: itemsMap["CL-BAUSCH-BIOTRUE"].id,
            quantity: 2,
            unit_price: itemsMap["CL-BAUSCH-BIOTRUE"].selling_price,
            coating_charges: 0,
            fitting_charges: 0,
            subtotal: o6Total,
          },
        ],
      },
      payments: {
        create: [
          {
            method: "CASH",
            amount: o6Final,
            payment_type: "FULL",
            transaction_ref: "CASH-COUNTER",
          },
        ],
      },
    },
  });

  // Order 7: Kabir Malhotra - FITTING (Fastrack Sport Frame + Standard AR Lens)
  const o7Total = itemsMap["FRM-FST-CHROME"].selling_price + itemsMap["LNS-VP-STD-AR-150"].selling_price; // 2199 + 1200 = 3399
  const o7Discount = 199.0;
  const o7Tax = (o7Total - o7Discount) * 0.12; // 3200 * 0.12 = 384
  const o7Final = o7Total - o7Discount + o7Tax; // 3584
  const o7Paid = 2000.0;
  const o7Balance = o7Final - o7Paid;

  await prisma.order.create({
    data: {
      bill_no: "VP-2026-0007",
      customerId: createdCustomers[6].id,
      prescriptionId: null,
      status: "FITTING",
      total_amount: o7Total,
      discount_amount: o7Discount,
      tax_amount: o7Tax,
      final_payable: o7Final,
      paid_amount: o7Paid,
      balance_amount: o7Balance,
      delivery_due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            itemId: itemsMap["FRM-FST-CHROME"].id,
            quantity: 1,
            unit_price: itemsMap["FRM-FST-CHROME"].selling_price,
            coating_charges: 0,
            fitting_charges: 0,
            subtotal: itemsMap["FRM-FST-CHROME"].selling_price,
          },
          {
            itemId: itemsMap["LNS-VP-STD-AR-150"].id,
            quantity: 1,
            unit_price: itemsMap["LNS-VP-STD-AR-150"].selling_price,
            coating_charges: 0,
            fitting_charges: 200,
            subtotal: itemsMap["LNS-VP-STD-AR-150"].selling_price + 200,
          },
        ],
      },
      payments: {
        create: [
          {
            method: "CASH",
            amount: o7Paid,
            payment_type: "ADVANCE",
            transaction_ref: "CASH-REG-01",
          },
        ],
      },
    },
  });

  // Order 8: Neha Reddy - PLACED (Ray-Ban Aviator + Essilor Crizal)
  const o8Total = itemsMap["FRM-RB-3025"].selling_price + itemsMap["LNS-ESS-CRIZAL-167"].selling_price; // 9500 + 4800 = 14300
  const o8Discount = 800.0;
  const o8Tax = (o8Total - o8Discount) * 0.12; // 13500 * 0.12 = 1620
  const o8Final = o8Total - o8Discount + o8Tax; // 15120
  const o8Paid = 7500.0;
  const o8Balance = o8Final - o8Paid;

  await prisma.order.create({
    data: {
      bill_no: "VP-2026-0008",
      customerId: createdCustomers[7].id,
      prescriptionId: rx8.id,
      status: "PLACED",
      total_amount: o8Total,
      discount_amount: o8Discount,
      tax_amount: o8Tax,
      final_payable: o8Final,
      paid_amount: o8Paid,
      balance_amount: o8Balance,
      delivery_due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            itemId: itemsMap["FRM-RB-3025"].id,
            quantity: 1,
            unit_price: itemsMap["FRM-RB-3025"].selling_price,
            coating_charges: 0,
            fitting_charges: 0,
            subtotal: itemsMap["FRM-RB-3025"].selling_price,
          },
          {
            itemId: itemsMap["LNS-ESS-CRIZAL-167"].id,
            quantity: 1,
            unit_price: itemsMap["LNS-ESS-CRIZAL-167"].selling_price,
            coating_charges: 0,
            fitting_charges: 250,
            subtotal: itemsMap["LNS-ESS-CRIZAL-167"].selling_price + 250,
          },
        ],
      },
      payments: {
        create: [
          {
            method: "UPI",
            amount: o8Paid,
            payment_type: "ADVANCE",
            transaction_ref: "UPI/261012998811/Paytm",
          },
        ],
      },
    },
  });

  console.log("🛒 Created 8 Active Orders across tracking statuses (Placed, Lens Processing, Fitting, Ready for Pickup, Delivered)");
  console.log("✅ VisionPulse Optical ERP & POS Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
