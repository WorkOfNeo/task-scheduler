"use client"

import { useState } from "react"
import { useClients } from "@/lib/clients-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { AddClientDialog } from "@/components/add-client-dialog"
import { Client } from "@/lib/firebase-service"
import { useRouter } from "next/navigation"

export default function ClientsPage() {
  const { clients, loading, error } = useClients()
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <AddClientDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </AddClientDialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Phone</th>
              <th className="text-left p-4 font-medium">Active Tasks</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr 
                key={client.id} 
                className="border-b hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <td className="p-4">{client.name}</td>
                <td className="p-4">{client.email}</td>
                <td className="p-4">{client.phone || "-"}</td>
                <td className="p-4">{client.activeTasks || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 