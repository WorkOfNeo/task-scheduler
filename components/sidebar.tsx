"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/lib/auth-context"
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  BarChart,
  LogOut,
  User,
  Settings2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SettingsSection } from "@/components/settings-section"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Clients",
    icon: Users,
    href: "/clients",
  },
  {
    label: "Tasks",
    icon: CheckSquare,
    href: "/tasks",
  },
  {
    label: "Planner",
    icon: Calendar,
    href: "/planner",
  },
  {
    label: "Analytics",
    icon: BarChart,
    href: "/analytics",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { userProfile, signOut } = useAuthContext()

  const isAdmin = userProfile?.role === 'admin'

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden [@media(min-width:700px)]:flex h-full w-64 flex-col fixed left-0 top-0 bottom-0 border-r bg-background">
        <div className="p-6">
          <h1 className="text-xl font-semibold">TaskFlow</h1>
        </div>
        
        <div className="flex-1 px-3 py-2">
          <nav className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-x-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors",
                  pathname === route.href
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-primary"
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto">
          <SettingsSection />
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <User className="h-4 w-4" />
                  <span className="truncate">{userProfile?.name || userProfile?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem>
                    Profile Settings
                  </DropdownMenuItem>
                </Link>
                {isAdmin && (
                  <Link href="/admin">
                    <DropdownMenuItem>
                      Admin Dashboard
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="[@media(min-width:700px)]:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
        <nav className="flex items-center justify-around p-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                pathname === route.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <route.icon className="h-5 w-5" />
              <span className="text-xs">{route.label}</span>
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="p-2">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem>
                  Profile Settings
                </DropdownMenuItem>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <DropdownMenuItem>
                    Admin Dashboard
                  </DropdownMenuItem>
                </Link>
              )}
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </>
  )
}
