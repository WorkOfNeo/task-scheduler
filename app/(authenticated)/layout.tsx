"use client"

import { useAuthContext } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Loader2 } from "lucide-react"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-full relative">
      <Sidebar />
      <div className="[@media(min-width:700px)]:pl-64 h-full">
        <main className="h-full p-8 pb-24 [@media(min-width:700px)]:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
} 