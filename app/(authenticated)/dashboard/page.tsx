"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Users, CheckCircle, Calendar, BarChart3, AlertCircle } from "lucide-react"
import Link from "next/link"
import { TaskSummary } from "@/components/task-summary"
import { ClientSummary } from "@/components/client-summary"
import { UpcomingTasks } from "@/components/upcoming-tasks"
import { getDashboardStats } from "@/lib/firebase-service"
import { CurrencyFormatter } from "@/components/currency-formatter"

export default function DashboardPage() {
  const { user, loading, userProfile } = useAuthContext()
  const router = useRouter()
  const [stats, setStats] = useState({
    openTasks: 0,
    notStartedTasks: {
      count: 0,
      latestDeadline: null as string | null
    },
    completedThisMonth: 0,
    hoursThisMonth: 0,
    revenueThisMonth: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, userProfile, router])

  useEffect(() => {
    async function loadStats() {
      if (!user) return

      try {
        setLoadingStats(true)
        const dashboardStats = await getDashboardStats(user.uid)
        setStats(dashboardStats)
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
      } finally {
        setLoadingStats(false)
      }
    }

    loadStats()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {userProfile?.name || 'User'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/planner">
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Today's Schedule
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.openTasks}</div>
                <p className="text-xs text-muted-foreground">Tasks with tracked time</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.notStartedTasks.count}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.notStartedTasks.latestDeadline 
                    ? `Latest deadline: ${formatDate(stats.notStartedTasks.latestDeadline)}`
                    : "No pending deadlines"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.completedThisMonth}</div>
                <p className="text-xs text-muted-foreground">Tasks completed</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  <CurrencyFormatter amount={stats.revenueThisMonth} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.hoursThisMonth} hours tracked
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Your tasks for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingTasks />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Client Summary</CardTitle>
            <CardDescription>Tasks by client</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientSummary />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
            <CardDescription>Overview of your task progress</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskSummary />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
