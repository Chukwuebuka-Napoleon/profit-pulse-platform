import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 lg:ml-0 p-4 md:p-8 pt-16 lg:pt-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
