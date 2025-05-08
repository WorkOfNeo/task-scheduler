"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Client } from "@/lib/firebase-service"
import { ClientForm } from "@/components/client-form"

interface EditClientDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, data: Partial<Client>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function EditClientDialog({ client, open, onOpenChange, onUpdate, onDelete }: EditClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>Update the client information below.</DialogDescription>
        </DialogHeader>
        <ClientForm 
          client={client} 
          onSuccess={() => onOpenChange(false)}
          onDelete={onDelete}
        />
      </DialogContent>
    </Dialog>
  )
}
