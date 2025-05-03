"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { useClients } from "@/lib/clients-context"
import { useTasks } from "@/lib/tasks-context"
import { Client, Task } from "@/lib/firebase-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EditClientDialog } from "@/components/edit-client-dialog"
import { TaskTable } from "@/components/task-table"
import { CurrencyFormatter } from "@/components/currency-formatter"
import { Mail, Phone, Building2, DollarSign, Briefcase } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function ClientPage() {
  const { id } = useParams()
  const { user } = useAuthContext()
  const { clients, loading: loadingClients } = useClients()
  const { tasks, loading: loadingTasks } = useTasks()
  const [client, setClient] = useState<Client | null>(null)
  const [clientTasks, setClientTasks] = useState<Task[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    if (clients && id) {
      const foundClient = clients.find(c => c.id === id)
      if (foundClient) {
        setClient(foundClient)
      }
    }
  }, [clients, id])

  useEffect(() => {
    if (tasks && client) {
      const filteredTasks = tasks.filter(task => task.clientId === client.id)
      setClientTasks(filteredTasks)
    }
  }, [tasks, client])

  if (loadingClients || loadingTasks) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Client not found</h2>
          <p className="text-muted-foreground">The client you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground">Client details and tasks</p>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>Edit Client</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Contact and financial details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{client.address}</span>
                </div>
              )}
              {client.hourlyRate && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Hourly Rate: <CurrencyFormatter amount={client.hourlyRate} /></span>
                </div>
              )}
              {client.monthlyWage && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>Monthly Wage: <CurrencyFormatter amount={client.monthlyWage} /></span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Statistics</CardTitle>
            <CardDescription>Overview of client tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Tasks</div>
                <div className="text-2xl font-bold">{clientTasks.length}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Completed Tasks</div>
                <div className="text-2xl font-bold">
                  {clientTasks.filter(task => task.status === "done").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>All tasks associated with this client</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskTable tasks={clientTasks} />
        </CardContent>
      </Card>

      <EditClientDialog
        client={client}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  )
} 