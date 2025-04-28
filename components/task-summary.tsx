"use client"

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getTaskStats } from "@/lib/firebase-service"
import { EmptyState } from "@/components/ui/empty-state"
import { ListTodo } from "lucide-react"

export function TaskSummary() {
  const [stats, setStats] = useState({
    todoCount: 0,
    inProgressCount: 0,
    doneCount: 0,
    totalCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTaskStats() {
      try {
        setLoading(true)
        const data = await getTaskStats()
        setStats(data)
      } catch (error) {
        console.error("Error loading task stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTaskStats()
  }, [])

  // Calculate percentages
  const todoPercentage = stats.totalCount > 0 ? Math.round((stats.todoCount / stats.totalCount) * 100) : 0
  const inProgressPercentage = stats.totalCount > 0 ? Math.round((stats.inProgressCount / stats.totalCount) * 100) : 0
  const donePercentage = stats.totalCount > 0 ? Math.round((stats.doneCount / stats.totalCount) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 w-20 bg-muted rounded"></div>
              <div className="flex items-center justify-between mt-3">
                <div className="h-8 w-8 bg-muted rounded"></div>
                <div className="h-4 w-12 bg-muted rounded"></div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full mt-4"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (stats.totalCount === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="No tasks yet"
        description="You haven't added any tasks yet. Add your first task to see statistics."
        actionLabel="Add Task"
        actionHref="/tasks"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-medium">To Do</div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-2xl font-bold">{stats.todoCount}</div>
            <div className="text-muted-foreground">{todoPercentage}%</div>
          </div>
          <Progress value={todoPercentage} className="mt-2" />
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium">In Progress</div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-2xl font-bold">{stats.inProgressCount}</div>
            <div className="text-muted-foreground">{inProgressPercentage}%</div>
          </div>
          <Progress value={inProgressPercentage} className="mt-2" />
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium">Done</div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-2xl font-bold">{stats.doneCount}</div>
            <div className="text-muted-foreground">{donePercentage}%</div>
          </div>
          <Progress value={donePercentage} className="mt-2" />
        </Card>
      </div>
    </div>
  )
}
