"use client"

import { useState } from 'react'
import { Settings2, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSettings } from '@/lib/settings-context'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScheduleEditor } from '@/components/schedule-editor'

const commonCurrencies = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }
]

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const { settings, updateSettings, schedules, addSchedule, updateSchedule, removeSchedule } = useSettings()
  const { toast } = useToast()

  const handleCurrencyChange = async (value: string) => {
    const selectedCurrency = commonCurrencies.find(c => c.code === value)
    if (selectedCurrency) {
      try {
        setSaving(true)
        await updateSettings({
          currency: {
            code: selectedCurrency.code,
            symbol: selectedCurrency.symbol,
            position: 'before'
          }
        })
        toast({
          title: "Settings Updated",
          description: `Default currency changed to ${selectedCurrency.name} (${selectedCurrency.symbol})`,
          duration: 3000,
        })
      } catch (error) {
        console.error("Error updating currency:", error)
        toast({
          title: "Error",
          description: "Failed to update currency settings. Please try again.",
          variant: "destructive",
          duration: 5000,
        })
      } finally {
        setSaving(false)
      }
    }
  }

  function handleAddSchedule() {
    addSchedule({ id: Date.now().toString(), days: [], from: "09:00", to: "17:00" })
  }

  if (!settings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings2 className="h-6 w-6" /> Settings
      </h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
            <CardDescription>Manage your currency preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={settings.currency.code}
                  onValueChange={handleCurrencyChange}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency">
                      {saving ? "Updating..." : settings.currency.code}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {commonCurrencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  This currency will be used as the default for new clients and tasks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedules</CardTitle>
            <CardDescription>
              Define your available work schedules. You can add multiple schedules for different days and times.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 && (
              <div className="text-muted-foreground text-sm mb-2">No schedules added yet.</div>
            )}
            {schedules.map(schedule => (
              <ScheduleEditor
                key={schedule.id}
                schedule={schedule}
                onChange={newSchedule => updateSchedule(schedule.id, newSchedule)}
                onRemove={() => removeSchedule(schedule.id)}
              />
            ))}
            <Button variant="outline" type="button" onClick={handleAddSchedule} className="mt-2">
              <Plus className="mr-2 h-4 w-4" /> Add Schedule
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 