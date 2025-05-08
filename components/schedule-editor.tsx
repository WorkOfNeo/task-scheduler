import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export interface ScheduleEditorProps {
  schedule: { id: string; days: string[]; from: string; to: string }
  onChange: (schedule: { id: string; days: string[]; from: string; to: string }) => void
  onRemove: () => void
}

export function ScheduleEditor({ schedule, onChange, onRemove }: ScheduleEditorProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 border rounded-md p-3 mb-2 bg-muted/30">
      <div className="flex flex-wrap gap-2 items-center">
        {daysOfWeek.map(day => (
          <label key={day} className="flex items-center gap-1 text-xs">
            <Checkbox
              checked={schedule.days.includes(day)}
              onCheckedChange={checked => {
                onChange({
                  ...schedule,
                  days: checked
                    ? [...schedule.days, day]
                    : schedule.days.filter(d => d !== day)
                })
              }}
            />
            {day}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs">From</Label>
        <Input
          type="time"
          value={schedule.from}
          onChange={e => onChange({ ...schedule, from: e.target.value })}
          className="w-24"
        />
        <Label className="text-xs">To</Label>
        <Input
          type="time"
          value={schedule.to}
          onChange={e => onChange({ ...schedule, to: e.target.value })}
          className="w-24"
        />
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} className="ml-auto text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
} 