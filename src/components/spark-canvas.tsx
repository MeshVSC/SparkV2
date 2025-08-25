"use client"

import { useState, useCallback } from "react"
import { useSpark } from "@/contexts/spark-context"
import { SparkCard } from "@/components/spark-card"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Spark } from "@/types/spark"

export function SparkCanvas() {
  const { state, actions } = useSpark()
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
      if (spark) {
        await actions.updateSpark(spark.id, {
          positionX: Math.random() * 600,
          positionY: Math.random() * 400,
        })
      }
    }

    setActiveSpark(null)
  }, [state.sparks, actions])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas, not on a spark
    if (e.target === e.currentTarget) {
      actions.selectSpark(null)
    }
  }, [actions])

  const filteredSparks = state.sparks.filter(spark => {
    if (!state.searchQuery) return true
    const query = state.searchQuery.toLowerCase()
    return (
      spark.title.toLowerCase().includes(query) ||
      spark.description?.toLowerCase().includes(query) ||
      (spark.tags && spark.tags.toLowerCase().includes(query))
    )
  })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div 
        className="relative w-full h-full bg-gradient-to-br from-background to-muted/20 overflow-hidden"
        onClick={handleCanvasClick}
      >
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Sparks */}
        {filteredSparks.map((spark) => (
          <div
            key={spark.id}
            className="absolute cursor-move transition-all duration-200 hover:scale-105"
            style={{
              left: spark.positionX || Math.random() * 600,
              top: spark.positionY || Math.random() * 400,
              transform: state.selectedSpark?.id === spark.id ? 'scale(1.05)' : 'scale(1)',
              zIndex: state.selectedSpark?.id === spark.id ? 10 : 1,
            }}
          >
            <SparkCard
              spark={spark}
              isSelected={state.selectedSpark?.id === spark.id}
              onClick={() => actions.selectSpark(spark)}
            />
          </div>
        ))}

        {/* Empty state */}
        {filteredSparks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">No sparks yet</h3>
                <p className="text-muted-foreground">Create your first spark to get started!</p>
              </div>
            </div>
          </div>
        )}

        {/* Drag overlay */}
        <DragOverlay>
          {activeSpark ? (
            <div className="opacity-80">
              <SparkCard
                spark={activeSpark}
                isSelected={false}
                onClick={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}