"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Users, CheckCircle, Calendar, BarChart3, AlertCircle, Info } from "lucide-react"
import Link from "next/link"
import { TaskSummary } from "@/components/task-summary"
import { ClientSummary } from "@/components/client-summary"
import { UpcomingTasks } from "@/components/upcoming-tasks"
import { getDashboardStats, Task } from "@/lib/firebase-service"
import { CurrencyFormatter } from "@/components/currency-formatter"
import { OverdueTasks } from "@/components/overdue-tasks"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useTasks } from "@/lib/tasks-context"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function DashboardPage() {
  const { user, loading, userProfile } = useAuthContext()
  const router = useRouter()
  const { tasks } = useTasks()
  const [stats, setStats] = useState({
    openTasks: 0,
    notStartedTasks: {
      count: 0,
      latestDeadline: null as string | null
    },
    completedThisMonth: 0,
    hoursThisMonth: 0,
    revenueThisMonth: 0,
    taskRevenue: 0,
    monthlyWages: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, userProfile, router])

  // Update stats whenever tasks change
  useEffect(() => {
    async function loadStats() {
      if (!user) return

      try {
        setLoadingStats(true)
        const dashboardStats = await getDashboardStats(user.uid)
        setStats(dashboardStats)
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
        toast.error("Failed to load dashboard statistics")
      } finally {
        setLoadingStats(false)
      }
    }

    loadStats()
  }, [user, tasks]) // Add tasks as a dependency

  // Filter upcoming and overdue tasks
  const upcomingTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate)
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return dueDate >= now && dueDate <= nextWeek
  })

  const overdueTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate)
    const now = new Date()
    return dueDate < now && task.status !== 'done'
  })

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
      <ToastContainer
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-2">
                      <div className="flex justify-between gap-4">
                        <span>Task Revenue:</span>
                        <CurrencyFormatter amount={stats.taskRevenue || 0} />
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Monthly Wages:</span>
                        <CurrencyFormatter amount={stats.monthlyWages || 0} />
                      </div>
                      <div className="border-t pt-2 flex justify-between gap-4 font-medium">
                        <span>Total:</span>
                        <CurrencyFormatter amount={stats.revenueThisMonth} />
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
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
            <UpcomingTasks tasks={upcomingTasks} loading={loadingStats} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Overdue Tasks</CardTitle>
            <CardDescription>Tasks past their due date</CardDescription>
          </CardHeader>
          <CardContent>
            <OverdueTasks tasks={overdueTasks} loading={loadingStats} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
            <CardDescription>Overview of your task progress</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskSummary />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Client Summary</CardTitle>
            <CardDescription>Tasks by client</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientSummary />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
