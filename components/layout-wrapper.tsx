"use client"

import { useEffect } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { TasksProvider } from "@/lib/tasks-context"
import { ClientsProvider } from "@/lib/clients-context"
import { Toaster } from "@/components/ui/toaster"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("[LayoutWrapper] Component mounted")
    return () => {
      console.log("[LayoutWrapper] Component unmounting")
    }
  }, [])

  return (
    <ErrorBoundary>
      <TasksProvider>
        <ClientsProvider>
          {children}
          <Toaster />
        </ClientsProvider>
      </TasksProvider>
    </ErrorBoundary>
  )
} 