"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Client, Task, getClients, getTasks } from "@/lib/firebase-service"
import { DollarSign, Clock } from "lucide-react"
import { CurrencyFormatter } from "@/components/currency-formatter"
import { useAuthContext } from "@/lib/auth-context"

export function ClientAnalytics() {
  const [clients, setClients] = useState<Client[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)
        const [clientsData, tasksData] = await Promise.all([
          getClients(user.uid),
          getTasks(user.uid)
        ])
        setClients(clientsData)
        setTasks(tasksData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Calculate time spent per client based on completed tasks
  const clientAnalyticsData = clients
    .map((client) => {
      const completedTasks = tasks.filter((task) => task.clientId === client.id && task.status === "done")

      const totalMinutes = completedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      
      // Calculate earnings based on hourly rate if available
      let earnings = 0
      if (client.hourlyRate) {
        earnings = (totalMinutes / 60) * client.hourlyRate
      } else if (client.monthlyWage && totalMinutes > 0) {
        // Estimate proportion of monthly work (assuming 160 hours/month)
        const monthlyMinutes = 160 * 60
        earnings = (totalMinutes / monthlyMinutes) * client.monthlyWage
      }

      return {
        id: client.id,
        name: client.name,
        value: totalMinutes,
        hours,
        minutes,
        earnings: Math.round(earnings * 100) / 100,
        hasRate: !!client.hourlyRate || !!client.monthlyWage,
        hourlyRate: client.hourlyRate,
        monthlyWage: client.monthlyWage,
      }
    })
    .filter((client) => client.value > 0)
    .sort((a, b) => b.value - a.value)

  // Colors for the charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-80 animate-pulse bg-muted rounded-lg"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-5 w-1/3 bg-muted rounded"></div>
                <div className="h-5 w-16 bg-muted rounded"></div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full mt-4"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (clientAnalyticsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-center">
        <div>
          <p className="text-muted-foreground">No completed tasks found.</p>
          <p className="text-muted-foreground text-sm mt-1">
            Complete tasks to see analytics data.
          </p>
        </div>
      </div>
    )
  }

  // Data for the earnings chart
  const clientEarningsData = [...clientAnalyticsData]
    .filter(client => client.hasRate)
    .sort((a, b) => b.earnings - a.earnings)

  const hasEarningsData = clientEarningsData.length > 0

  return (
    <div className="space-y-6">
      <Tabs defaultValue="time">
        <TabsList>
          <TabsTrigger value="time" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Time Spent</span>
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-1" disabled={!hasEarningsData}>
            <DollarSign className="h-4 w-4" />
            <span>Earnings</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="time" className="mt-4">
      <div className="h-80">
        <ChartContainer
          config={{
            client1: {
              label: "Client 1",
              color: "hsl(var(--chart-1))",
            },
            client2: {
              label: "Client 2",
              color: "hsl(var(--chart-2))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                    data={clientAnalyticsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, hours, minutes }) => `${name}: ${hours}h ${minutes}m`}
              >
                    {clientAnalyticsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => {
                  const hours = Math.floor(value / 60)
                  const minutes = value % 60
                  return [`${hours}h ${minutes}m`, "Time Spent"]
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

          <div className="space-y-4 mt-4">
            {clientAnalyticsData.map((client, index) => (
              <Card key={client.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{client.name}</div>
              <div className="text-sm">
                {client.hours}h {client.minutes}m
              </div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                      width: `${(client.value / clientAnalyticsData[0].value) * 100}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="earnings" className="mt-4">
          {hasEarningsData ? (
            <>
              <div className="h-80">
                <ChartContainer
                  config={{
                    earnings: {
                      label: "Earnings",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clientEarningsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="earnings"
                        nameKey="name"
                        label={({ name, earnings }) => `${name}: ${earnings}`}
                      >
                        {clientEarningsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => {
                          return [<CurrencyFormatter amount={value} />, "Earnings"]
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              <div className="space-y-4 mt-4">
                {clientEarningsData.map((client, index) => (
                  <Card key={client.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm">
                        <CurrencyFormatter amount={client.earnings} />
                        {client.hourlyRate ? ` (at ` : 
                         client.monthlyWage ? ` (from ` : ''}
                        {client.hourlyRate ? (
                          <CurrencyFormatter amount={client.hourlyRate} /> + '/hr'
                        ) : client.monthlyWage ? (
                          <CurrencyFormatter amount={client.monthlyWage} /> + '/month'
                        ) : ''}
                        {client.hourlyRate || client.monthlyWage ? ')' : ''}
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(client.earnings / clientEarningsData[0].earnings) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-80 text-center">
              <div>
                <p className="text-muted-foreground">No earnings data available.</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Add hourly rates or monthly wages to clients to see earnings analytics.
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
