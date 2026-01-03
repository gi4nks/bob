# Bob - Resource Builder

Bob is a high-performance resource management and planning application designed for engineering teams. It provides deep visibility into team capacity, project allocations, financials, and strategic skill mapping through a high-density, modern interface.

## 🚀 Key Features

### 📅 Timeline Dashboard
- **Vertical Alignment**: Projects and leaves are strictly slotted into rows for perfect horizontal tracking across weeks.
- **Visual Clarity**: Alphabetical sorting of projects and clear intensity indicators.
- **What-If Mode**: Toggle to show/hide "Draft" allocations for scenario planning without affecting confirmed schedules.

### 👤 Resource 360 (Mission Control)
- **Unified 360 View**: Every project allocation and leave segment for an individual engineer in one place.
- **Visual Intensity**: Load-based progress bars and status indicators (Free/Busy/Overloaded).
- **Financial Impact**: Real-time calculation of an engineer's cost to the portfolio based on their `dailyRate`.
- **Performance Retro**: Historical 6-month analysis of workload and project engagement.

### 🌴 Leave Management
- **Scalable Interface**: Grouped by Month/Year to handle large teams and long histories.
- **Status Tracking**: Visual badges for Active, Upcoming, and Past leaves.
- **Partial-Day Support**: Book leave in hours or full days.

### 🛠️ Conflict Resolution Center
- **Smart Detection**: Instantly identifies capacity overloads and leave overlaps.
- **High-Density Overview**: Compact list view for managing large volumes of alerts.
- **One-Click Fixes**: Heuristic recommendations to balance developer capacity.

### 📊 Utilization Center (Analytics)
- **Executive Metrics**: Bench waste, delivery velocity, team seniority, and initiative counts.
- **Utilization Forecast**: 6-month heatmap of team capacity vs. committed load.
- **Bench & Off-boarding**: Proactive views for unallocated resources and imminent project roll-offs.

### 💰 Project Financials
- **Budget Tracking**: Real-time monitoring of budget consumption and headroom.
- **Burn Rate Analysis**: Monthly spend estimates per project and across the entire portfolio.
- **Project Inspector**: Detailed drill-down into cost centers and monthly trends.

### 🏗️ Roadmap & Skills Gap
- **Roadmap Cockpit**: Compact, horizontal phase navigation with integrated outcome tracking.
- **Skills Gap Analysis**: Technical capability audit vs. project requirements.
- **Strategic Insights**: AI-powered assessment of hiring or upskilling needs.

### ✨ Smart Match Engine
- **Heuristic Scoring**: Ranks candidates based on a weighted mix of availability and technical proficiency.
- **Project Aware**: Automatically populates criteria based on project phase dates and requirements.

## 🛠 Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, daisyUI 5.
- **Icons**: Lucide React.
- **Database**: SQLite with Prisma ORM.
- **State Management**: Context-based store with Server Actions for persistence.

## 🐳 Docker Deployment
```bash
docker-compose up -d --build
```
The database is stored in the `./data` directory on the host machine for persistent storage.

## 🧪 Testing & Data
- **Populate Database**: `make feed` - Wipes and populates the DB with a comprehensive, realistic dataset.
- **Wipe Database**: `make db-clean` - Resets the database to an empty state.

## 🏷️ Version Management
Bob uses semantic versioning managed via `standard-version`.

- **Automatic Release**: `make release` - Bumps version based on commit messages and updates `CHANGELOG.md`.
- **Patch Release**: `make patch` - Bumps the patch version (0.0.x).
- **Minor Release**: `make minor` - Bumps the minor version (0.x.0).
- **Major Release**: `make major` - Bumps the major version (x.0.0).
