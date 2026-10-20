import React, { useState } from 'react';
import { Calendar, Target, Camera, LayoutDashboard, User, Flame, Milestone, Settings as SettingsIcon, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}

const PRIMARY_NAV = [
  { id: 'daily', label: 'Daily', icon: Calendar },
  { id: 'habits', label: 'Habits', icon: Flame },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'plans', label: 'Plans', icon: Milestone },
];

const SECONDARY_NAV = [
  { id: 'focus', label: 'Daily Focus', icon: Target },
  { id: 'body', label: 'Archive', icon: Camera },
  { id: 'dashboard', label: 'Insights', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'profile', label: 'Profile', icon: User },
];

export function Layout({ children, activeTab, setActiveTab, user }: LayoutProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const allNav = [...PRIMARY_NAV, ...SECONDARY_NAV];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[240px] flex-col bg-sidebar border-r p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="bg-black w-7 h-7 rounded-md flex items-center justify-center">
            <span className="text-[11px] font-bold text-white">m2</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">myday2</h1>
        </div>

        <nav className="flex-1 space-y-1">
          {allNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] transition-all',
                activeTab === item.id
                  ? 'bg-black/5 text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-black/5 hover:text-foreground'
              )}
            >
              <item.icon className="h-[18px] w-[18px] opacity-70" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 space-y-4">
          <div className="flex items-center gap-3 px-2 pt-4 border-t">
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
              alt="Avatar"
              className="h-8 w-8 rounded-full bg-neutral-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{user.displayName}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-sidebar border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-black w-6 h-6 rounded-md flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">m2</span>
          </div>
          <h1 className="text-base font-bold tracking-tight">myday2</h1>
        </div>
        <img
          src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
          alt="Avatar"
          className="h-8 w-8 rounded-full border"
          onClick={() => setActiveTab('profile')}
        />
      </header>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-2 py-2 flex justify-around items-center z-50 pb-safe">
        {PRIMARY_NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 min-w-[56px] transition-all',
              activeTab === item.id ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <item.icon className={cn('h-5 w-5', activeTab === item.id && 'scale-110')} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger render={
            <button className={cn('flex flex-col items-center gap-1 p-2 min-w-[56px] transition-all', SECONDARY_NAV.some((i) => i.id === activeTab) ? 'text-foreground' : 'text-muted-foreground')}>
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          } />
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="text-left">More</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 p-4">
              {SECONDARY_NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMoreOpen(false); }}
                  className={cn(
                    'flex items-center gap-2.5 px-4 py-3 rounded-lg text-[14px] border border-border transition-all',
                    activeTab === item.id ? 'bg-black/5 font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
