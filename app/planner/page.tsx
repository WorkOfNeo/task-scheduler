import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { DailyPlanner } from "@/components/daily-planner"
import { TaskSelector } from "@/components/task-selector"

export default function PlannerPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Planner</h1>
          <p className="text-muted-foreground">Schedule and manage your day</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>{today}</span>
          </Button>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-5 h-[700px] flex flex-col">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Drag and drop tasks to schedule your day</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <DailyPlanner />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Available Tasks</CardTitle>
            <CardDescription>Select tasks to add to your schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskSelector />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
