"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Client, deleteClient } from "@/lib/firebase-service"
import { DeleteClientDialog } from "@/components/delete-client-dialog"

interface EditClientDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, data: Partial<Client>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function EditClientDialog({ client, open, onOpenChange, onUpdate, onDelete }: EditClientDialogProps) {
  const [name, setName] = useState(client.name)
  const [email, setEmail] = useState(client.email)
  const [phone, setPhone] = useState(client.phone || "")
  const [hourlyRate, setHourlyRate] = useState(client.hourlyRate?.toString() || "")
  const [monthlyWage, setMonthlyWage] = useState(client.monthlyWage?.toString() || "")
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(client.name)
      setEmail(client.email)
      setPhone(client.phone || "")
      setHourlyRate(client.hourlyRate?.toString() || "")
      setMonthlyWage(client.monthlyWage?.toString() || "")
    }
  }, [client, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return

    setLoading(true)
    try {
      // Create base client data with required fields
      const updatedData: any = {
        name,
        email,
      }
      
      // Only add optional fields if they have values
      if (phone) updatedData.phone = phone
      if (hourlyRate) updatedData.hourlyRate = parseFloat(hourlyRate)
      if (monthlyWage) updatedData.monthlyWage = parseFloat(monthlyWage)

      if (onUpdate) {
        await onUpdate(client.id, updatedData)
      } else {
        // Fallback to toast if no onUpdate provided
    toast({
      title: "Client updated",
          description: "Client information has been updated successfully.",
    })
      }

    onOpenChange(false)
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update the client information below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter client email"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter client phone"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="Enter hourly rate"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthlyWage">Monthly Wage ($)</Label>
                <Input
                  id="monthlyWage"
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyWage}
                  onChange={(e) => setMonthlyWage(e.target.value)}
                  placeholder="Enter monthly wage"
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Client
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteClientDialog
        client={client}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDelete={onDelete}
      />
    </>
  )
}
