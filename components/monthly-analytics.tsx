"use client"

import { mockTasks } from "@/lib/mock-data"
import { ChartContainer } from "@/components/ui/chart"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

export function MonthlyAnalytics() {
  // Get the current date
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Get the number of weeks in the current month
  const weeksInMonth = getWeeksInMonth(currentYear, currentMonth)

  // Generate data for each week
  const monthlyData = weeksInMonth.map((week) => {
    // Find tasks completed in this week
    const completedTasks = mockTasks.filter((task) => {
      const taskDate = new Date(task.dueDate)
      return isDateInWeek(taskDate, week.start, week.end) && task.status === "done"
    })

    // Calculate total hours worked
    const totalMinutes = completedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0)

    return {
      name: `Week ${week.weekNum}`,
      tasks: completedTasks.length,
      hours: Math.round((totalMinutes / 60) * 10) / 10, // Round to 1 decimal place
    }
  })

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
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="var(--color-tasks)" />
              <YAxis yAxisId="right" orientation="right" stroke="var(--color-hours)" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="tasks"
                name="Tasks Completed"
                stroke="var(--color-tasks)"
                activeDot={{ r: 8 }}
              />
              <Line yAxisId="right" type="monotone" dataKey="hours" name="Hours Worked" stroke="var(--color-hours)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <div className="text-sm font-medium text-muted-foreground">Monthly Tasks Completed</div>
          <div className="text-3xl font-bold mt-2">{monthlyData.reduce((sum, week) => sum + week.tasks, 0)}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm font-medium text-muted-foreground">Monthly Hours Worked</div>
          <div className="text-3xl font-bold mt-2">
            {monthlyData.reduce((sum, week) => sum + week.hours, 0).toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get weeks in a month
function getWeeksInMonth(year: number, month: number) {
  const weeks: { weekNum: number; start: Date; end: Date }[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const currentWeekStart = new Date(firstDay)
  let weekNum = 1

  while (currentWeekStart <= lastDay) {
    const currentWeekEnd = new Date(currentWeekStart)
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6)

    weeks.push({
      weekNum,
      start: new Date(currentWeekStart),
      end: new Date(Math.min(currentWeekEnd.getTime(), lastDay.getTime())),
    })

    currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    weekNum++
  }

  return weeks
}

// Helper function to check if a date is within a week
function isDateInWeek(date: Date, weekStart: Date, weekEnd: Date) {
  return date >= weekStart && date <= weekEnd
}
