"use client"

import { SparkCanvas } from "@/components/spark-canvas"
import { KanbanView } from "@/components/kanban-view"
import { TimelineView } from "@/components/timeline-view"
import { ConnectionManagementPanel } from "@/components/connection-management-panel"
import { Sidebar } from "@/components/sidebar"
import { SparkProvider, useSpark } from "@/contexts/spark-context"
import { useGuest } from "@/contexts/guest-context"
import { PresenceProvider } from "@/components/collaboration/presence-provider"
import { OnlineUsersPanel } from "@/components/collaboration/online-users-panel"
import { useDemoPresence } from "@/hooks/use-demo-presence"

export default function App() {
  return (
    <SparkProvider>
      <PresenceProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden relative">
            <ViewSwitcher />
            
            {/* Online users panel - positioned absolutely */}
            <div className="absolute top-4 right-4 w-64 z-10">
              <OnlineUsersPanel />
            </div>
          </main>
        </div>
      </PresenceProvider>
    </SparkProvider>
  )
}

function ViewSwitcher() {
  const { state } = useSpark()
  
  // Initialize demo presence for development
  useDemoPresence()
  
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