"use client"

import { SparkCanvas } from "@/components/spark-canvas"
import { KanbanView } from "@/components/kanban-view"
import { TimelineView } from "@/components/timeline-view"
import { ConnectionManagementPanel } from "@/components/connection-management-panel"
import { useSpark } from "@/contexts/spark-context"

export default function App() {
  return <ViewSwitcher />
}

function ViewSwitcher() {
  const { state } = useSpark()
  
  switch (state.viewMode) {
    case "kanban":
      return <KanbanView />
    case "timeline":
      return <TimelineView />
    case "connections":
      return <ConnectionManagementPanel />
    default:
      return <SparkCanvas />
  }
}