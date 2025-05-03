"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { addClient } from "@/lib/firebase-service"

interface AddClientDialogProps {
  children: React.ReactNode;
  onClientAdded?: () => void;
}

export function AddClientDialog({ children, onClientAdded }: AddClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [monthlyWage, setMonthlyWage] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      
      // Create base client data with required fields
      const clientData: any = {
        name,
        email,
      }
      
      // Only add optional fields if they have values
      if (phone) clientData.phone = phone
      if (hourlyRate) clientData.hourlyRate = parseFloat(hourlyRate) || 0
      if (monthlyWage) clientData.monthlyWage = parseFloat(monthlyWage) || 0
      
      await addClient(clientData)
      
      toast({
        title: "Client added",
        description: `${name} has been added to your clients.`,
      })

      // Reset form and close dialog
      setName("")
      setEmail("")
      setPhone("")
      setHourlyRate("")
      setMonthlyWage("")
      setOpen(false)
      
      // Call the callback if provided
      if (onClientAdded) {
        onClientAdded()
      }
    } catch (error) {
      console.error("Error adding client:", error)
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
            <DialogDescription>Add a new client to your list. Click save when you're done.</DialogDescription>
          </DialogHeader>
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
              <Label htmlFor="phone">Phone</Label>
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
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
