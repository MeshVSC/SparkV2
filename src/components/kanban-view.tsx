"use client"

import { useSpark } from "@/contexts/spark-context"
import { SparkCard } from "@/components/spark-card"
import { SparkStatus } from "@/types/spark"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TreePine, 
  Trees,
  Plus,
  Leaf
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateSparkDialog } from "@/components/create-spark-dialog"
import { useState, useCallback } from "react"
import { DndContext, DragEndEvent, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core"
import { Spark } from "@/types/spark"

// Draggable Spark Card Component for Kanban
function DraggableKanbanCard({ spark, isSelected, onClick }: { spark: Spark; isSelected: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: spark.id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <SparkCard
        spark={spark}
        isSelected={isSelected}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  )
}

// Droppable Column Component
function DroppableColumn({ 
  column, 
  children, 
  onSparkClick 
}: { 
  column: any; 
  children: React.ReactNode; 
  onSparkClick: (spark: Spark) => void 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <Card 
      ref={setNodeRef} 
      className={`h-fit transition-all duration-200 ${isOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <column.icon className="h-5 w-5" />
            <CardTitle className="text-lg">{column.title}</CardTitle>
          </div>
          <Badge variant="outline" className={column.color}>
            {column.sparks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        
        {column.sparks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <column.icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {column.title.toLowerCase()}s yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function KanbanView() {
  const { state, actions } = useSpark()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeSpark, setActiveSpark] = useState<Spark | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const spark = state.sparks.find(s => s.id === active.id)
    setActiveSpark(spark || null)
  }, [state.sparks])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const spark = state.sparks.find(s => s.id === active.id)
      const newStatus = over.id as SparkStatus
      
      if (spark && spark.status !== newStatus) {
        await actions.updateSpark(spark.id, {
          status: newStatus,
        })
        // Refresh user stats after status change
        actions.loadUserStats()
      }
    }

    setActiveSpark(null)
  }, [state.sparks, actions])

  const filteredSparks = state.sparks.filter(spark => {
    if (!state.searchQuery) return true
    const query = state.searchQuery.toLowerCase()
    return (
      spark.title.toLowerCase().includes(query) ||
      spark.description?.toLowerCase().includes(query) ||
      (spark.tags && spark.tags.toLowerCase().includes(query))
    )
  })

  const columns = [
    {
      id: SparkStatus.SEEDLING,
      title: "Seedling",
      icon: Leaf,
      color: "bg-green-100 text-green-800 border-green-200",
      sparks: filteredSparks.filter(spark => spark.status === SparkStatus.SEEDLING)
    },
    {
      id: SparkStatus.SAPLING,
      title: "Sapling",
      icon: TreePine,
      color: "bg-blue-100 text-blue-800 border-blue-200",
      sparks: filteredSparks.filter(spark => spark.status === SparkStatus.SAPLING)
    },
    {
      id: SparkStatus.TREE,
      title: "Tree",
      icon: TreePine,
      color: "bg-purple-100 text-purple-800 border-purple-200",
      sparks: filteredSparks.filter(spark => spark.status === SparkStatus.TREE)
    },
    {
      id: SparkStatus.FOREST,
      title: "Forest",
      icon: Trees,
      color: "bg-orange-100 text-orange-800 border-orange-200",
      sparks: filteredSparks.filter(spark => spark.status === SparkStatus.FOREST)
    }
  ]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full p-6 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kanban Board</h1>
            <p className="text-muted-foreground">
              Organize your sparks by their growth stage
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Spark
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <DroppableColumn 
              key={column.id} 
              column={column}
              onSparkClick={(spark) => actions.selectSpark(spark)}
            >
              {column.sparks.map((spark) => (
                <div key={spark.id} className="cursor-pointer">
                  <DraggableKanbanCard
                    spark={spark}
                    isSelected={state.selectedSpark?.id === spark.id}
                    onClick={() => actions.selectSpark(spark)}
                  />
                </div>
              ))}
            </DroppableColumn>
          ))}
        </div>

        <CreateSparkDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </DndContext>
  )
}