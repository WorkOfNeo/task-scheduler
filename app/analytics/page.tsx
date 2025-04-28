import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientAnalytics } from "@/components/client-analytics"
import { WeeklyAnalytics } from "@/components/weekly-analytics"
import { MonthlyAnalytics } from "@/components/monthly-analytics"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Track your productivity and client work</p>
      </div>

      <Tabs defaultValue="clients">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Analytics</CardTitle>
              <CardDescription>Time spent per client based on completed tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientAnalytics />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="weekly" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Summary</CardTitle>
              <CardDescription>Tasks completed and hours worked this week</CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyAnalytics />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>Tasks completed and hours worked this month</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyAnalytics />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
