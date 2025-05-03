"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, MoreHorizontal, Users } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditClientDialog } from "@/components/edit-client-dialog"
import { DeleteClientDialog } from "@/components/delete-client-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Client } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"
import { useClients } from "@/lib/clients-context"

export function ClientList() {
  const { clients, loading, error, deleteClient: deleteClientFromContext, updateClient } = useClients()
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteClientState, setDeleteClientState] = useState<Client | null>(null)
  const { toast } = useToast()

  const handleDeleteClient = async (client: Client) => {
    try {
      await deleteClientFromContext(client.id)
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

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading clients: {error.message}</p>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditClient(client)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteClientState(client)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>{client.email}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {client.phone || "No phone number"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {client.city && client.country ? `${client.city}, ${client.country}` : "No location"}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{client.activeTasks || 0} active tasks</span>
                <span>•</span>
                <span>{client.completedTasks || 0} completed</span>
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
