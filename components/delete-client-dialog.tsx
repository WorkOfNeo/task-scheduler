"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Client } from "@/lib/firebase-service"
import { useClients } from "@/lib/clients-context"

interface DeleteClientDialogProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => Promise<void>
}

export function DeleteClientDialog({ client, open, onOpenChange, onDelete }: DeleteClientDialogProps) {
  const { deleteClient } = useClients()

  const handleDelete = async () => {
    try {
      await deleteClient(client.id)
      await onDelete()
    } catch (error) {
      console.error("Error deleting client:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Client</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{client.name}"? This action cannot be undone and will also delete all associated tasks.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
