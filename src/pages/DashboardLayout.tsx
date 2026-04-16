import { Outlet } from "react-router-dom";
import { ClientSidebar } from "@/components/ClientSidebar";
import { SystemStatus } from "@/components/SystemStatus";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <ClientSidebar />
      <div className="flex-1 flex flex-col lg:ml-0">
        <main className="flex-1 p-4 md:p-8 pt-16 lg:pt-8 overflow-auto">
          <Outlet />
        </main>
        <footer className="border-t border-border px-6 py-3 flex items-center justify-center">
          <SystemStatus />
        </footer>
      </div>
    </div>
  );
}
