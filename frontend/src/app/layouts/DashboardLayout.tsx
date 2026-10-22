import { Outlet } from "react-router";
import { Header } from "@/components/layout/Header";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-50 rounded-lg bg-card px-4 py-3 text-sm text-foreground shadow-panel focus:not-sr-only"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="min-w-0 p-3 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:p-5 sm:pb-[calc(10rem+env(safe-area-inset-bottom))] lg:ml-62 lg:p-4 lg:pl-5">
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className="mt-4 min-w-0 rounded-xl py-3 sm:py-4 lg:pt-1"
        >
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
