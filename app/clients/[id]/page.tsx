"use client"

import { Button } from "@/components/ui/button"
import { PlusCircle, ArrowLeft } from "lucide-react"
import { TaskList } from "@/components/task-list"
import { AddTaskDialog } from "@/components/add-task-dialog"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getClient, Client } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"
import React from "react"

export default function ClientTasksPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use() since it's now a Promise in Next.js 15
  const unwrappedParams = React.use(params)
  const clientId = unwrappedParams.id
  
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function loadClient() {
      try {
        setLoading(true)
        const clientData = await getClient(clientId)
        if (clientData) {
          setClient(clientData)
        } else {
          toast({
            title: "Error",
            description: "Client not found",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error loading client:", error)
        toast({
          title: "Error",
          description: "Failed to load client details",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadClient()
  }, [clientId, toast])

  if (!client && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/clients">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Client Not Found</h1>
            </div>
            <p className="text-muted-foreground">The client you're looking for doesn't exist or was deleted.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/clients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{client?.name || 'Loading...'}</h1>
          </div>
          <p className="text-muted-foreground">Manage tasks for {client?.name || 'this client'}</p>
        </div>
        <AddTaskDialog clientId={clientId}>
          <Button id="add-task-button">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </AddTaskDialog>
      </div>

      {client && <TaskList clientId={client.id} />}
    </div>
  )
}
