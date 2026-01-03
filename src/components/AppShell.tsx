import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import CommandPalette from "./CommandPalette";

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-screen bg-base-100">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 bg-base-200/50">
          {children}
        </main>
      </div>
      <Sidebar />
      <CommandPalette />
    </div>
  );
};

export default AppShell;
