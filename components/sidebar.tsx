"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BarChart3, Calendar, Home, Users, CheckSquare, ChevronLeft, ChevronRight, Menu } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { onNavigate, useSPA } from "@/lib/spa-provider"

interface SidebarProps {
  setOpen?: (open: boolean) => void
}

export default function Sidebar({ setOpen }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidth] = useState<number | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const initialX = useRef<number>(0)
  const initialWidth = useRef<number>(0)
  const { isLoading } = useSPA()
  
  // Set initial width based on collapsed state
  useEffect(() => {
    if (!width) {
      setWidth(collapsed ? 64 : 224);
    }
  }, [collapsed, width]);
  
  // Handle window resize and initial width setup
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 768) {
        setCollapsed(false)
        setWidth(null) // Let it be fluid on mobile
      }
    }
    
    // Initial check
    checkWidth()
    
    // Listen for window resize
    window.addEventListener('resize', checkWidth)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkWidth)
  }, [])
  
  // Mouse event handlers for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    initialX.current = e.clientX
    initialWidth.current = width || 224
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    // Add a class to the body to prevent text selection during resize
    document.body.classList.add('resize-sidebar')
  }
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    
    const minWidth = 48 // Absolute minimum width
    const deltaX = e.clientX - initialX.current
    let newWidth = initialWidth.current + deltaX
    
    // Only enforce minimum width, no maximum
    if (newWidth < minWidth) newWidth = minWidth
    
    setWidth(newWidth)
    
    // Auto-collapse when very narrow
    setCollapsed(newWidth <= 80)
  }
  
  const handleMouseUp = () => {
    setIsResizing(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.classList.remove('resize-sidebar')
  }

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/",
      active: pathname === "/",
    },
    {
      label: "Clients",
      icon: Users,
      href: "/clients",
      active: pathname === "/clients" || pathname.startsWith("/clients/"),
    },
    {
      label: "Tasks",
      icon: CheckSquare,
      href: "/tasks",
      active: pathname === "/tasks",
    },
    {
      label: "Planner",
      icon: Calendar,
      href: "/planner",
      active: pathname === "/planner",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/analytics",
      active: pathname === "/analytics",
    },
  ]

  const handleNavigate = onNavigate(() => {
    if (setOpen) {
      setOpen(false)
    }
  })

  return (
    <div 
      ref={sidebarRef}
      style={{ width: width ? `${width}px` : undefined }} 
      className={cn(
        "relative flex h-full flex-col border-r bg-muted/40 overflow-hidden",
        isResizing ? "select-none transition-none" : "transition-width duration-200",
        collapsed ? "md:w-16" : "md:w-56"
      )}
    >
      <div className="flex h-14 items-center border-b px-3 justify-between overflow-hidden">
        <Link href="/" className={cn(
          "flex items-center font-semibold min-w-0",
          collapsed ? "justify-center" : "gap-2"
        )} onClick={handleNavigate} prefetch={true}>
          <Calendar className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="overflow-hidden text-ellipsis whitespace-nowrap">TaskFlow</span>}
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("h-7 w-7 p-0 hidden md:flex flex-shrink-0", isResizing && "opacity-0")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <nav className={cn(
          "grid items-start gap-0.5 overflow-hidden py-1",
          collapsed ? "px-1" : "px-2"
        )}>
          {routes.map((route) => (
            <Link key={route.href} href={route.href} onClick={handleNavigate} prefetch={true}>
              <Button
                variant={route.active ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full h-9 whitespace-nowrap overflow-hidden",
                  collapsed ? "justify-center p-0" : "justify-start gap-2",
                  route.active && "bg-muted font-medium"
                )}
                title={route.label}
              >
                <route.icon className={cn("h-4 w-4 flex-shrink-0", collapsed && "mx-auto")} />
                {!collapsed && (
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {route.label}
                  </span>
                )}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
      
      {/* Resize handle - make it wider for easier grabbing */}
      <div 
        className={cn(
          "absolute top-0 right-[-4px] w-4 h-full cursor-ew-resize z-50",
          isResizing ? "bg-primary/10" : "hover:bg-primary/5"
        )}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}
