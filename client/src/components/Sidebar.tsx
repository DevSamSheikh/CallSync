import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  Wallet,
  Banknote,
  LogOut,
  Menu,
  X,
  PhoneCall,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdminOrDeo = user?.role === "admin" || user?.role === "deo";

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Financials", href: "/financials", icon: Wallet, hide: !user || user.role !== 'agent' },
    { label: "Manage Finance", href: "/manage-finance", icon: Banknote, hide: !isAdminOrDeo },
    { label: "Reports", href: "/reports", icon: FileText },
    ...(isAdminOrDeo
      ? [
          { label: "Data Entry", href: "/entry", icon: PlusCircle },
          { label: "Users", href: "/users", icon: Users },
        ]
      : []),
  ].filter(item => !item.hide);

  const SidebarContent = () => (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r border-border/50 transition-all duration-300",
        isCollapsed ? "w-20" : "w-72",
      )}
    >
      <div className="p-6 border-b border-border/50 flex items-center justify-between">
        <div
          className={cn(
            "flex items-center gap-3 transition-opacity duration-300",
            isCollapsed && "opacity-0 w-0 overflow-hidden",
          )}
        >
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <PhoneCall className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl leading-none">
              CallSync
            </h1>
            <p className="text-xs text-muted-foreground capitalize mt-1">
              {user?.role} CRM
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex h-8 w-8 hover:bg-accent"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <Menu className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 py-6 px-4 space-y-4 gap-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex my-2 items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  isCollapsed && "px-0 justify-center",
                )}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? item.label : ""}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-primary",
                  )}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t border-border/50">
        <div
          className={cn(
            "flex items-center gap-3 mb-4 px-2 transition-all",
            isCollapsed && "flex-col items-center px-0",
          )}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md shrink-0">
            {user?.name?.charAt(0) || "U"}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all border-[#E43636]/20",
            isCollapsed && "justify-center px-0",
          )}
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <style>{`
        :root {
          --sidebar-offset: ${isCollapsed ? "80px" : "288px"};
        }
      `}</style>
      <div
        className={cn(
          "hidden lg:block h-screen fixed left-0 top-0 z-50 transition-all duration-300",
          isCollapsed ? "w-20" : "w-72",
        )}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="shadow-md bg-white hover:bg-white"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
