# Bob - Resource Builder (v1.0.0)

Bob is a high-performance resource management and planning application designed for engineering teams. It provides deep visibility into team capacity, project allocations, financials, and strategic skill mapping through a high-density, modern interface.

## 🚀 Core Modules

### 📅 Timeline Dashboard
- High-density weekly view of squad allocations.
- Sticky columns with backdrop blur.
- "What-If" toggle for draft scenario visualization.

### 👤 Resource 360
- Unified view of individual engineer workload.
- Load-based intensity bars and status badges (Free/Busy/Overloaded).
- Financial period cost calculation.

### 🌴 Leave Management
- Chronological grouping by Month/Year.
- Conflict-aware booking.

### 🛠️ Conflict Center
- Compact list-based management of portfolio alerts.
- Visual severity indicators (High/Medium).

### 📊 Utilization & Analytics
- 6-month historical pulse vs. forecast.
- Strategic insights for bench waste and delivery velocity.

### 🏗️ Roadmap Cockpit
- Compact horizontal phase navigation.
- Integrated outcome/KR tracking.

### ✨ Smart Match Engine
- Heuristic candidate ranking based on skill level and availability.

## 🛠 Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, daisyUI 5.
- **Database**: SQLite with Prisma ORM.

## 📝 Usage for Gemini CLI
1. **Date Logic**: Use `isOverlapping` from `dateUtils` for all date-based calculations.
2. **UI Aesthetic**: Maintain the **High Density** design language:
   - Use `font-black uppercase tracking-tight` for headers.
   - Use `rounded-[2rem]` for main containers, `rounded-xl` for items.
   - Prefer compact tables and list rows over large cards.
   - Use `text-[10px]` or `text-[9px]` for labels and auxiliary info.
3. **Modals**: Follow the multi-column, icon-driven pattern found in `NewAllocationModal`.
4. **Data Seed**: Use the "Comprehensive Realistic" pattern found in `prisma/seed.ts` for any data generation.
