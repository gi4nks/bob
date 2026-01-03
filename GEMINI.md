# Bob - Resource Builder

Bob is a high-performance resource management and planning application designed for engineering teams. It provides deep visibility into team capacity, project allocations, financials, and strategic skill mapping.

## 🚀 Key Features

### 📅 Timeline Dashboard
- **Vertical Alignment**: Projects and leaves are strictly slotted into rows for perfect horizontal tracking across weeks.
- **Visual Clarity**: Alphabetical sorting of projects and clear percentage indicators (e.g., "(50%)").
- **What-If Mode**: Toggle to show/hide "Draft" allocations. Drafts appear with a dashed border and reduced opacity, allowing for scenario planning without affecting confirmed schedules.

### 👤 Resource Management (Mission Control)
- **Unified 360 View**: Every project allocation and leave segment for an individual engineer in one place.
- **Financial Impact**: Real-time calculation of an engineer's cost to the portfolio based on their `dailyRate` and confirmed assignments for the selected period.
- **Performance Retro**: Historical 6-month analysis of workload and project engagement.
- **Smart CRUD**: Direct inline editing, deletion, and splitting of allocations.

### 🌴 Leave Management
- **Scalable Interface**: Grouped by Month/Year to handle large teams and long histories.
- **Advanced Filtering**: Status tabs (Active, Upcoming, History) and real-time search.
- **Partial-Day Support**: Book leave in hours (e.g., 4h) or full days.
- **Proactive Auto-Scheduling**: Bob automatically splits project allocations around full-day leave periods to keep the schedule clean.

### 🛠️ Conflict Resolution Center
- **Bob's Recommendation Engine**: Analyzes issues and proposes one-click fixes.
- **Auto-Balance**: Proportionally scales allocations to fit a developer's capacity.
- **Intelligent Reassignment**: Suggests alternative available engineers for conflicting projects.

### 📊 Utilization Center (Analytics)
- **Utilization Forecast**: Month-by-month heatmap of team capacity vs. committed load.
- **Workforce Stats**: Detailed tracking of worked days, sick leave, and vacations.
- **Bench & Off-boarding**: Specific views for unallocated resources and imminent project roll-offs (2, 4, and 8-week windows).

### 💰 Project Financials
- **Budget Tracking**: Define project budgets and monitor real-time utilization.
- **Burn Rate Analysis**: Provides monthly spend estimates for each project and the entire portfolio.
- **Financial Alerts**: Visual indicators when committed costs approach or exceed project budgets.

### 🏗️ Project & Roadmap Management
- **Project Phases**: Divide projects into custom phases (Discovery, Build, etc.) and visualize them directly on the Gantt chart.
- **Skills Gap Analysis**: Define expertise requirements per project/phase. The gap report highlights critical shortages and hiring needs.
- **High-Density Squad View**: Searchable engineer grids for managing large teams.

### ✨ Smart Match 2.0
- **Project Aware**: Automatically populates search criteria based on project phase dates and technical requirements.
- **Heuristic Scoring**: Ranks candidates based on a weighted mix of availability and technical proficiency.

## 🛠 Tech Stack
- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, daisyUI.
- **Icons**: Lucide React.
- **Database**: SQLite with Prisma ORM.
- **State Management**: Context-based store with Server Actions for persistence.

## 🐳 Docker Deployment
```bash
docker-compose up -d --build
```
The database is stored in the `./data` directory on the host machine for persistent storage.

## 🧪 Testing & Data
- **Populate Database**: `make feed` - Wipes and populates the DB with 16 engineers, 7 projects, and complex requirements.
- **Wipe Database**: `make db-clean` - Resets the database to an empty state.

## 🏷️ Version Management
Bob uses semantic versioning managed via `standard-version`.

- **Automatic Release**: `make release` - Bumps version based on commit messages and updates `CHANGELOG.md`.
- **Patch Release**: `make patch` - Bumps the patch version (0.0.x).
- **Minor Release**: `make minor` - Bumps the minor version (0.x.0).
- **Major Release**: `make major` - Bumps the major version (x.0.0).

## 📝 Usage for Gemini CLI
1. Use `isOverlapping` from `dateUtils` for all date-based logic.
2. All management modals must follow the multi-column, icon-driven design pattern found in `NewAllocationModal`.
3. Use the `Performance Retro` logic in `resource/page.tsx` for any new historical analysis features.