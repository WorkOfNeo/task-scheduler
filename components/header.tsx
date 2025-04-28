"use client"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Bell, Menu, X } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Sidebar from "@/components/sidebar"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b bg-background px-3 md:px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden mr-1">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 md:hidden">
          <div className="flex h-full">
            <Sidebar setOpen={setOpen} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap">
          {/* You can dynamically set page title here */}
        </h2>
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <ModeToggle />
      </div>
    </header>
  )
}
