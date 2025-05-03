"use client"

import { useState } from "react"
import { useClients } from "@/lib/clients-context"
import { Client } from "@/lib/firebase-service"
import { Button } from "@/components/ui/button"
import { ClientForm } from "@/components/client-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Plus } from "lucide-react"

export default function ClientsPage() {
  const { clients, loading, error } = useClients()
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedClient(undefined)
    setIsDialogOpen(true)
  }

  const handleSuccess = () => {
    setIsDialogOpen(false)
    setSelectedClient(undefined)
  }

  if (loading) {
    return <div>Loading clients...</div>
  }

  if (error) {
    return <div>Error loading clients: {error.message}</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedClient ? "Edit Client" : "Add New Client"}
              </DialogTitle>
            </DialogHeader>
            <ClientForm client={selectedClient} onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>VAT</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Hourly Rate</TableHead>
              <TableHead>Monthly Wage</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.city}</TableCell>
                <TableCell>{client.country}</TableCell>
                <TableCell>{client.vat}</TableCell>
                <TableCell>{client.currency}</TableCell>
                <TableCell>
                  {client.hourlyRate ? `${client.hourlyRate} ${client.currency}` : "-"}
                </TableCell>
                <TableCell>
                  {client.monthlyWage ? `${client.monthlyWage} ${client.currency}` : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(client)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No clients found. Add your first client to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 