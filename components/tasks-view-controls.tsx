"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { ArrowDownAZ, ArrowUpAZ, Calendar, Clock, Search, SlidersHorizontal, Users } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TasksViewControls() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("due-date")
  const [groupBy, setGroupBy] = useState("client")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Group by</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="due-date">Due Date</SelectItem>
              <SelectItem value="none">No Grouping</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Sort Tasks By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setSortBy("title")} className={sortBy === "title" ? "bg-muted" : ""}>
                  <span>Title</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("due-date")}
                  className={sortBy === "due-date" ? "bg-muted" : ""}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Due Date</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("duration")}
                  className={sortBy === "duration" ? "bg-muted" : ""}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Duration</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("client")} className={sortBy === "client" ? "bg-muted" : ""}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Client</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleSortDirection}>
                {sortDirection === "asc" ? (
                  <>
                    <ArrowUpAZ className="mr-2 h-4 w-4" />
                    <span>Ascending</span>
                  </>
                ) : (
                  <>
                    <ArrowDownAZ className="mr-2 h-4 w-4" />
                    <span>Descending</span>
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
