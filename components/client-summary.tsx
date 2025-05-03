"use client"

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Client, Task, getClients, getTasks } from "@/lib/firebase-service"
import { Users } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { useAuthContext } from "@/lib/auth-context"

export function ClientSummary() {
  const [clients, setClients] = useState<Client[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)
        const [clientsData, tasksData] = await Promise.all([
          getClients(user.uid),
          getTasks(user.uid)
        ])
        setClients(clientsData)
        setTasks(tasksData)
      } catch (error) {
        console.error("Error loading data for client summary:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Calculate tasks per client
  const clientTaskCounts = clients.map((client) => {
    const clientTasks = tasks.filter((task) => task.clientId === client.id)
    const totalTasks = clientTasks.length
    const completedTasks = clientTasks.filter((task) => task.status === "done").length
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      id: client.id,
      name: client.name,
      totalTasks,
      completedTasks,
      percentage,
    }
  })

  // Sort by total tasks (descending)
  clientTaskCounts.sort((a, b) => b.totalTasks - a.totalTasks)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-5 w-1/3 bg-muted rounded"></div>
              <div className="h-4 w-1/4 bg-muted rounded"></div>
            </div>
            <div className="h-2 w-full bg-muted rounded-full mt-3"></div>
          </Card>
        ))}
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No clients yet"
        description="You haven't added any clients yet. Add your first client to see the summary."
        actionLabel="Add Client"
        actionHref="/clients"
      />
    )
  }

  return (
    <div className="space-y-4">
      {clientTaskCounts.map((client) => (
        <Card key={client.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">{client.name}</div>
            <div className="text-sm text-muted-foreground">
              {client.completedTasks} / {client.totalTasks} tasks
            </div>
          </div>
          <Progress value={client.percentage} className="mt-2" />
        </Card>
      ))}
    </div>
  )
}
