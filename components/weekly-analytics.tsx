"use client"

import { useState, useEffect } from "react"
import { Task, getTasks } from "@/lib/firebase-service"
import { ChartContainer } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

export function WeeklyAnalytics() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  // Load tasks
  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true)
        const tasksData = await getTasks()
        setTasks(tasksData)
      } catch (error) {
        console.error("Error loading tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  // Get the current date
  const today = new Date()

  // Generate dates for the past 7 days
  const pastWeekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - i))
    return date
  })

  // Format dates as strings for comparison
  const formatDateForComparison = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  // Calculate tasks completed and hours worked per day
  const weeklyData = pastWeekDates.map((date) => {
    const dateString = formatDateForComparison(date)

    // Find tasks completed on this date
    const completedTasks = tasks.filter((task) => {
      const taskDate = new Date(task.dueDate)
      return formatDateForComparison(taskDate) === dateString && task.status === "done"
    })

    // Calculate total hours worked
    const totalMinutes = completedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0)

    return {
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      tasks: completedTasks.length,
      hours: Math.round((totalMinutes / 60) * 10) / 10, // Round to 1 decimal place
    }
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-80 animate-pulse bg-muted rounded-lg"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-md p-4 animate-pulse">
            <div className="h-5 w-1/2 bg-muted rounded mb-2"></div>
            <div className="h-8 w-1/3 bg-muted rounded"></div>
          </div>
          <div className="border rounded-md p-4 animate-pulse">
            <div className="h-5 w-1/2 bg-muted rounded mb-2"></div>
            <div className="h-8 w-1/3 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="h-80">
        <ChartContainer
          config={{
            tasks: {
              label: "Tasks Completed",
              color: "hsl(var(--chart-1))",
            },
            hours: {
              label: "Hours Worked",
              color: "hsl(var(--chart-2))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="var(--color-tasks)" />
              <YAxis yAxisId="right" orientation="right" stroke="var(--color-hours)" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="tasks" name="Tasks Completed" fill="var(--color-tasks)" />
              <Bar yAxisId="right" dataKey="hours" name="Hours Worked" fill="var(--color-hours)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Tasks Completed</div>
          <div className="text-3xl font-bold mt-2">{weeklyData.reduce((sum, day) => sum + day.tasks, 0)}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Hours Worked</div>
          <div className="text-3xl font-bold mt-2">
            {weeklyData.reduce((sum, day) => sum + day.hours, 0).toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  )
}
