# VisionCraft Optical Store ERP & POS System

A clinical and retail Optical Store Enterprise Resource Planning (ERP) and Point of Sale (POS) system built specifically for modern optometry clinics, eyewear boutiques, and optical workshops.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & ORM**: SQLite with [Prisma ORM](https://www.prisma.io/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🌟 Domain Features

### 1. Optical POS Register (`/pos`)
- **Fast Optical Checkout**: Filter by Frames, Ophthalmic Lenses, Contact Lenses, and Accessories.
- **Patient & Prescription Linkage**: Select patient and link active optical prescription (OD / OS diopter details previewed right in the register).
- **Custom Glazing & Edging Notes**: Per-item workshop instructions (e.g., bevel profiles, rimless drill specs, tint percentage).
- **Split Payments & Advance Deposits**: Collect deposit upon order placement with automated remaining balance calculation due upon customer pickup.
- **Instant Printable Receipt & Job Slip**: Print sales invoices and lab tickets with optical diopter tables and barcode layout.

### 2. Optical Prescriptions (Rx) Console (`/prescriptions`)
- Complete diopter refraction records:
  - **OD (Right Eye) & OS (Left Eye)**: Sphere (SPH), Cylinder (CYL), Axis (1° - 180°), Addition (ADD), Visual Acuity (VA), Monocular Pupillary Distance (PD).
  - **Binocular Total PD**: Total millimeters alignment.
  - **Lens Type Recommendations**: Single Vision, Blue-Cut, Progressive Freeform, Bifocal, Photochromic.
  - **Optometrist & Expiry Tracking**: Prescribing doctor license and 2-year expiration schedule.
  - **Direct "Order Eyewear" Action**: 1-click shortcut to launch POS checkout with prescription pre-attached.

### 3. Glazing Workshop & Lab Pipeline (`/lab-jobs`)
- Optical order progression:
  `PENDING` ➔ `LENS_ORDERED` ➔ `IN_WORKSHOP` ➔ `FITTING` ➔ `QA_PASSED` ➔ `COMPLETED`
- Lensometer verification tracking and glazier technician notes.
- Automatic status synchronization with order pickup readiness.

### 4. Eyewear & Lens Inventory (`/inventory`)
- Specialized attributes for eyewear:
  - **Frames**: Frame shape (Wayfarer, Rectangle, Round, Aviator, Cat-Eye), Size (Eye-Bridge-Temple), Color, Material (Acetate, Titanium, TR90).
  - **Lenses**: Refractive Index (1.50, 1.56, 1.60, 1.67, 1.74), Optical Coatings (Blue-Cut, Anti-Reflective, Photochromic).
  - **Contact Lenses**: Base Curve, Diameter, Power Range.
- Real-time stock counts, profit margin computation, low-stock threshold alerts, and instant stock adjusters.

### 5. Patients Directory & Clinical History (`/customers`)
- Patient profiles with phone numbers, emails, addresses, and clinical sensitivities (e.g. titanium frame requirements, screen fatigue).
- Full prescription timeline and past eyewear purchases drawer.

### 6. Orders, Invoices & Balance Collector (`/orders`)
- Comprehensive order ledger tracking payment statuses (`PAID`, `PARTIAL`, `UNPAID`).
- "Collect Balance" modal for settling remaining deposits when customers pick up their finished spectacles.
- Re-print receipt modal for thermal printers or invoice sheets.

### 7. Clinical Optometry Appointments (`/appointments`)
- Calendar schedule for digital eye exams, contact lens fittings, and frame styling consultations.
- Status management (`SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).

### 8. Executive Optical Analytics Dashboard (`/`)
- Total revenue and pending receivables overview.
- Active workshop queue status and ready-for-pickup counts.
- Category sales breakdown (Frames vs. Lenses vs. Contacts vs. Accessories).
- Low-stock warning indicators and daily appointment bookings.

### 9. Store Branding & Tax Configuration (`/settings`)
- Custom store name, address, tax registration number, tax rate %, and invoice warranty terms.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database & Seed Sample Optical Data
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🗄️ Database Architecture (`prisma/schema.prisma`)

- `Customer`: Patient demographic details, clinical notes, and relations.
- `Optometrist`: Doctor details, license numbers, and appointment schedules.
- `Prescription`: Refraction diopter measurements (OD/OS SPH, CYL, AXIS, ADD, VA, PD).
- `Product`: Eyewear catalog (Frames, Lenses, Contact Lenses, Accessories).
- `Order`: Sales transactions, financial calculations, and fulfillment tracking.
- `OrderItem`: Line items with custom workshop instructions.
- `Payment`: Deposits and balance settlement records.
- `LabJob`: Workshop glazing, edging, and quality control tracker.
- `Appointment`: Clinical consultation bookings.
- `StoreSetting`: Studio branding, tax rates, and warranty terms.
