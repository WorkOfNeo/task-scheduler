import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskTable } from "@/components/task-table"
import { TasksViewControls } from "@/components/tasks-view-controls"

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">View, sort, and group all your tasks</p>
      </div>

      <TasksViewControls />

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TaskTable filter="all" />
        </TabsContent>

        <TabsContent value="todo">
          <TaskTable filter="todo" />
        </TabsContent>

        <TabsContent value="in-progress">
          <TaskTable filter="in-progress" />
        </TabsContent>

        <TabsContent value="done">
          <TaskTable filter="done" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
