"use client"

import { useState } from "react"
import { SparkCanvas } from "@/components/spark-canvas"
import { KanbanView } from "@/components/kanban-view"
import { TimelineView } from "@/components/timeline-view"
import { Sidebar } from "@/components/sidebar"
import { SparkProvider, useSpark } from "@/contexts/spark-context"

export default function Home() {
  return (
    <SparkProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <ViewSwitcher />
        </main>
      </div>
    </SparkProvider>
  )
}

function ViewSwitcher() {
  const { state } = useSpark()
  
  switch (state.viewMode) {
    case "kanban":
      return <KanbanView />
    case "timeline":
      return <TimelineView />
    default:
      return <SparkCanvas />
  }
}