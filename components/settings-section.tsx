"use client"

import { useState } from 'react'
import { Settings, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSettings } from '@/lib/settings-context'
import { useToast } from '@/components/ui/use-toast'

const CURRENCY_OPTIONS = [
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' }
]

export function SettingsSection() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { settings, updateSettings } = useSettings()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      
      const currencyCode = formData.get('currency') as string
      const currencyPosition = formData.get('position') as 'before' | 'after'
      
      const selectedCurrency = CURRENCY_OPTIONS.find(c => c.code === currencyCode)
      
      if (!selectedCurrency) {
        throw new Error('Invalid currency selected')
      }

      await updateSettings({
        currency: {
          code: selectedCurrency.code,
          symbol: selectedCurrency.symbol,
          position: currencyPosition
        }
      })

      toast({
        title: "Settings updated",
        description: "Your currency settings have been updated.",
      })

      setOpen(false)
    } catch (error) {
      console.error('Error updating settings:', error)
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-auto border-t pt-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full justify-start">
            <Settings2 className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your application settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select name="currency" defaultValue={settings.currency.code}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.name} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency Position</Label>
              <Select name="position" defaultValue={settings.currency.position}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before amount (e.g., $100)</SelectItem>
                  <SelectItem value="after">After amount (e.g., 100 kr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 