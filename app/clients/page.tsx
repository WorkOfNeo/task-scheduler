import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ClientTable } from "@/components/client-table"
import { AddClientDialog } from "@/components/add-client-dialog"

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your clients and their tasks</p>
        </div>
        <AddClientDialog>
          <Button id="add-client-button">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </AddClientDialog>
      </div>

      <ClientTable />
    </div>
  )
}
