"use client"

import { useState, useEffect } from "react"
import { DataTable, ColumnDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, EyeIcon } from "lucide-react"
import Link from "next/link"
import { EditClientDialog } from "@/components/edit-client-dialog"
import { DeleteClientDialog } from "@/components/delete-client-dialog"
import { Client, getClients, deleteClient, updateClient } from "@/lib/firebase-service"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function ClientTable() {
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
      setClients(clients.filter((c) => c.id !== client.id))
      toast({
        title: "Success",
        description: `${client.name} has been deleted`,
      })
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
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
  
  // Define table columns
  const columns: ColumnDef<Client>[] = [
    {
      id: "name",
      header: "Name",
      accessorFn: (row) => row.name,
      cell: ({ row }) => <span>{row.original.name}</span>,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "email",
      header: "Email",
      accessorFn: (row) => row.email,
      cell: ({ row }) => <span>{row.original.email}</span>,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "activeTasks",
      header: "Active Tasks",
      accessorFn: (row) => row.activeTasks || 0,
      cell: ({ row }) => (
        <Badge variant={row.original.activeTasks > 0 ? "default" : "outline"}>
          {row.original.activeTasks || 0}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      id: "completedTasks",
      header: "Completed Tasks",
      accessorFn: (row) => row.completedTasks || 0,
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-muted">
          {row.original.completedTasks || 0}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Actions",
      accessorFn: (row) => row.id,
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Link href={`/clients/${row.original.id}`}>
            <Button variant="ghost" size="sm">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setEditClient(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteClientState(row.original)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableFiltering: false,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={clients}
        searchKey="name"
        initialPageSize={10}
        showFilters={false}
      />

      {editClient && (
        <EditClientDialog 
          client={editClient} 
          open={!!editClient} 
          onOpenChange={() => setEditClient(null)} 
          onUpdate={handleUpdateClient}
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
    </>
  )
} 