"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, MoreHorizontal, Users } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditClientDialog } from "@/components/edit-client-dialog"
import { DeleteClientDialog } from "@/components/delete-client-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Client, getClients, deleteClient, updateClient } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteClientState, setDeleteClientState] = useState<Client | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadClients() {
      try {
        setLoading(true)
        const data = await getClients()
        setClients(data)
      } catch (error) {
        console.error("Error loading clients:", error)
        toast({
          title: "Error",
          description: "Failed to load clients",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [toast])

  const handleDeleteClient = async (client: Client) => {
    try {
      await deleteClient(client.id)
      setClients(clients.filter(c => c.id !== client.id))
      toast({
        title: "Success",
        description: `${client.name} has been deleted.`,
      })
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateClient = async (id: string, data: Partial<Client>) => {
    try {
      await updateClient(id, data)
      setClients(clients.map((client) => 
        client.id === id ? { ...client, ...data } : client
      ))
      toast({
        title: "Success",
        description: "Client updated successfully",
      })
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-6 w-2/3 bg-muted rounded"></div>
              <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div className="h-4 w-1/3 bg-muted rounded"></div>
                <div className="h-4 w-1/3 bg-muted rounded"></div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="h-9 w-full bg-muted rounded"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No clients found"
        description="You haven't added any clients yet. Add your first client to get started."
        actionLabel="Add Client"
        onClick={() => {
          // This will be handled by the AddClientDialog in the parent component
          document.getElementById('add-client-button')?.click()
        }}
      />
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <Link key={client.id} href={`/clients/${client.id}`} className="block group">
          <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{client.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => e.preventDefault()}
                    >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        setEditClient(client);
                      }}
                    >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteClientState(client);
                      }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription>{client.email}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-sm">
              <p className="text-muted-foreground">Active Tasks: {client.activeTasks}</p>
              <p className="text-muted-foreground">Completed Tasks: {client.completedTasks}</p>
            </div>
          </CardContent>
          <CardFooter>
              <div className="w-full py-2 text-center text-sm font-medium text-primary group-hover:underline">
                View Tasks
              </div>
          </CardFooter>
        </Card>
        </Link>
      ))}

      {editClient && (
        <EditClientDialog 
          client={editClient} 
          open={!!editClient} 
          onOpenChange={() => setEditClient(null)} 
          onUpdate={handleUpdateClient}
          onDelete={() => handleDeleteClient(editClient)}
        />
      )}

      {deleteClientState && (
        <DeleteClientDialog 
          client={deleteClientState} 
          open={!!deleteClientState} 
          onOpenChange={() => setDeleteClientState(null)} 
          onDelete={() => handleDeleteClient(deleteClientState)}
        />
      )}
    </div>
  )
}
