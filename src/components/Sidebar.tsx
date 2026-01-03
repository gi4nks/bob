import React from "react";
import Link from "next/link";
import { 
  Construction, 
  Users, 
  Briefcase, 
  CalendarDays, 
  Sparkles, 
  Plane, 
  AlertTriangle, 
  LayoutGrid, 
  Activity, 
  ShieldAlert, 
  DollarSign,
  Contact,
  LineChart
} from "lucide-react";
import packageInfo from "../../package.json";

const Sidebar = () => {
  return (
    <div className="drawer-side z-20">
      <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
      <div className="flex flex-col w-80 min-h-full bg-base-100 text-base-content border-r border-base-300">
        <ul className="menu p-4 flex-1">
          {/* Logo / Brand */}
          <li className="mb-8">
            <div className="flex items-center gap-4 px-2 hover:bg-transparent text-primary">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-12 shadow-lg">
                  <Construction className="w-7 h-7" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase italic">Bob</h1>
                <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest leading-none">Resource Builder</p>
              </div>
            </div>
          </li>

          {/* Navigation Sections */}
          
          <li className="menu-title mt-4 text-[10px] font-black uppercase tracking-widest opacity-40">Strategy</li>
          <li className="mb-1">
            <Link href="/" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <CalendarDays className="w-5 h-5" />
              Timeline Dashboard
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/reports/roadmap" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <LayoutGrid className="w-5 h-5" />
              Portfolio Roadmap
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/projects" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <Briefcase className="w-5 h-5" />
              Projects Portfolio
            </Link>
          </li>

          <li className="menu-title mt-6 text-[10px] font-black uppercase tracking-widest opacity-40">Talent & Availability</li>
          <li className="mb-1">
            <Link href="/team" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <Users className="w-5 h-5" />
              Team Directory
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/reports/resource" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <Contact className="w-5 h-5" />
              Resource 360
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/leaves" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <Plane className="w-5 h-5" />
              Leave Management
            </Link>
          </li>

          <li className="menu-title mt-6 text-[10px] font-black uppercase tracking-widest opacity-40">Operations</li>
          <li className="mb-1">
            <Link href="/search" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <Sparkles className="w-5 h-5" />
              Smart Match
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/alerts" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <AlertTriangle className="w-5 h-5" />
              Conflicts & Alerts
            </Link>
          </li>

          <li className="menu-title mt-6 text-[10px] font-black uppercase tracking-widest opacity-40">Insights</li>
          <li className="mb-1">
            <Link href="/reports/utilization" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <Activity className="w-5 h-5" />
              Utilization Forecast
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/reports/financials" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <DollarSign className="w-5 h-5" />
              Project Financials
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/reports/skills-gap" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <ShieldAlert className="w-5 h-5" />
              Skills Gap Analysis
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/matrix" className="active:bg-primary active:text-primary-content focus:bg-primary focus:text-primary-content font-bold">
              <LayoutGrid className="w-5 h-5" />
              Skill Matrix
            </Link>
          </li>
        </ul>
        
        {/* Version info */}
        <div className="p-4 border-t border-base-300 bg-base-200/30">
          <div className="flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-bold uppercase tracking-widest">Version</span>
            <span className="text-[10px] font-mono font-bold">v{packageInfo.version}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
