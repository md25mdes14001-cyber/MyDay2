"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CheckSquare,
  Activity,
  Target,
  CalendarDays,
  PieChart,
  Settings,
  BrainCircuit,
  LogOut,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";
import { NotificationCenter } from "@/components/notification-center";
import { useState } from "react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Habits", href: "/dashboard/habits", icon: Activity },
  { name: "Goals", href: "/dashboard/goals", icon: Target },
  { name: "AI Planner", href: "/dashboard/planner", icon: BrainCircuit },
  { name: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { name: "Insights", href: "/dashboard/insights", icon: PieChart },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Connect to real-time event stream
  const { isConnected } = useRealtime({
    onEvent: (event) => {
      console.log("[Realtime]", event.type, event.payload);
    },
  });

  const userName = session?.user?.name || "User";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-[family-name:var(--font-geist-sans)]">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-zinc-200/50 bg-zinc-50 flex-col hidden md:flex fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200/50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">M2</span>
            </div>
            <span className="font-semibold tracking-tight text-lg">myday2</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative",
                    isActive
                      ? "text-black bg-white shadow-sm border border-zinc-200/50"
                      : "text-zinc-500 hover:text-black hover:bg-zinc-100"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-black" : "text-zinc-400"
                    )}
                  />
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg border border-zinc-200 bg-white shadow-sm -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200/50">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors mt-1"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-zinc-200 shadow-xl flex flex-col"
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M2</span>
                </div>
                <span className="font-semibold tracking-tight text-lg">
                  myday2
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1",
                    pathname === item.href
                      ? "text-black bg-zinc-100"
                      : "text-zinc-500"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-200/50">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 md:px-8 border-b border-zinc-200/50 bg-white/50 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-zinc-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold capitalize">
              {pathname === "/dashboard"
                ? "Overview"
                : pathname.split("/").pop()}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Real-time indicator */}
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-400" : "bg-zinc-300"
              )}
              title={isConnected ? "Connected" : "Reconnecting…"}
            />
            <NotificationCenter />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-zinc-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
