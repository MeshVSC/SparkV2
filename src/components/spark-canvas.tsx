"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useSpark } from "@/contexts/spark-context"
import { useSearch } from "@/contexts/search-context"
import { SparkCard } from "@/components/spark-card"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors, useDraggable } from "@dnd-kit/core"
import { Spark } from "@/types/spark"

interface ConnectionLine {
  id: string
  fromSparkId: string
  toSparkId: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

interface TouchGestureState {
  isActive: boolean
  initialTouches: TouchList | null
  lastTouches: TouchList | null
  gestureType: 'none' | 'pan' | 'pinch' | 'longpress' | 'swipe'
  startTime: number
  initialDistance: number
  currentScale: number
  panVelocity: { x: number; y: number }
  longPressTimer: NodeJS.Timeout | null
  swipeThreshold: number
}

// Draggable Spark Card Component
function DraggableSparkCard({ spark, isSelected, onClick }: { spark: Spark; isSelected: boolean; onClick: () => void }) {
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

export function SparkCanvas() {
  const { state, actions } = useSpark()
  const { filteredSparks } = useSearch()
  const [activeSpark, setActiveSpark] = useState<Spark | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [touchGesture, setTouchGesture] = useState<TouchGestureState>({
    isActive: false,
    initialTouches: null,
    lastTouches: null,
    gestureType: 'none',
    startTime: 0,
    initialDistance: 0,
    currentScale: 1,
    panVelocity: { x: 0, y: 0 },
    longPressTimer: null,
    swipeThreshold: 50
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Touch gesture helper functions
  const getTouchDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }, [])

  const getTouchCenter = useCallback((touches: TouchList): { x: number; y: number } => {
    let x = 0, y = 0
    for (let i = 0; i < touches.length; i++) {
      x += touches[i].clientX
      y += touches[i].clientY
    }
    return { x: x / touches.length, y: y / touches.length }
  }, [])

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!canvasRef.current) return { x: clientX, y: clientY }
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: (clientX - rect.left - canvasTransform.x) / canvasTransform.scale,
      y: (clientY - rect.top - canvasTransform.y) / canvasTransform.scale
    }
  }, [canvasTransform])

  const getSwipeDirection = useCallback((startTouch: Touch, endTouch: Touch): string => {
    const deltaX = endTouch.clientX - startTouch.clientX
    const deltaY = endTouch.clientY - startTouch.clientY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }, [])

  const getSwipeVelocity = useCallback((startTouch: Touch, endTouch: Touch, timeDelta: number): number => {
    const distance = Math.sqrt(
      Math.pow(endTouch.clientX - startTouch.clientX, 2) +
      Math.pow(endTouch.clientY - startTouch.clientY, 2)
    )
    return distance / timeDelta
  }, [])

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const currentTime = Date.now()
    
    // Clear any existing long press timer
    if (touchGesture.longPressTimer) {
      clearTimeout(touchGesture.longPressTimer)
    }

    // Set up long press detection for single touch
    let longPressTimer: NodeJS.Timeout | null = null
    if (e.touches.length === 1) {
      longPressTimer = setTimeout(() => {
        setTouchGesture(prev => ({ ...prev, gestureType: 'longpress' }))
        
        // Get touched spark for context menu
        const touch = e.touches[0]
        const canvasCoords = getCanvasCoordinates(touch.clientX, touch.clientY)
        const touchedSpark = state.sparks.find(spark => {
          const sparkX = spark.positionX || 0
          const sparkY = spark.positionY || 0
          return canvasCoords.x >= sparkX && canvasCoords.x <= sparkX + 256 &&
                 canvasCoords.y >= sparkY && canvasCoords.y <= sparkY + 200
        })
        
        if (touchedSpark) {
          actions.selectSpark(touchedSpark)
          // Could trigger context menu here
        }
      }, 500)
    }

    setTouchGesture({
      isActive: true,
      initialTouches: e.touches,
      lastTouches: e.touches,
      gestureType: e.touches.length === 2 ? 'pinch' : 'pan',
      startTime: currentTime,
      initialDistance: getTouchDistance(e.touches),
      currentScale: canvasTransform.scale,
      panVelocity: { x: 0, y: 0 },
      longPressTimer,
      swipeThreshold: 50
    })
  }, [touchGesture.longPressTimer, getTouchDistance, getCanvasCoordinates, state.sparks, actions, canvasTransform.scale])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    if (!touchGesture.isActive || !touchGesture.initialTouches) return

    const currentTouches = e.touches
    const timeDelta = Date.now() - touchGesture.startTime

    // Clear long press timer on movement
    if (touchGesture.longPressTimer) {
      clearTimeout(touchGesture.longPressTimer)
      setTouchGesture(prev => ({ ...prev, longPressTimer: null }))
    }

    if (currentTouches.length === 2 && touchGesture.gestureType === 'pinch') {
      // Pinch-to-zoom gesture
      const currentDistance = getTouchDistance(currentTouches)
      const scale = (currentDistance / touchGesture.initialDistance) * touchGesture.currentScale
      const clampedScale = Math.max(0.5, Math.min(3, scale))
      
      const center = getTouchCenter(currentTouches)
      const initialCenter = getTouchCenter(touchGesture.initialTouches)
      
      setCanvasTransform(prev => ({
        ...prev,
        scale: clampedScale,
        x: prev.x + (center.x - initialCenter.x),
        y: prev.y + (center.y - initialCenter.y)
      }))
    } else if (currentTouches.length === 1 && touchGesture.gestureType === 'pan') {
      // Pan gesture
      const currentTouch = currentTouches[0]
      const initialTouch = touchGesture.initialTouches[0]
      
      const deltaX = currentTouch.clientX - initialTouch.clientX
      const deltaY = currentTouch.clientY - initialTouch.clientY
      
      // Calculate velocity
      const velocity = {
        x: timeDelta > 0 ? deltaX / timeDelta : 0,
        y: timeDelta > 0 ? deltaY / timeDelta : 0
      }

      setCanvasTransform(prev => ({
        ...prev,
        x: deltaX,
        y: deltaY
      }))

      setTouchGesture(prev => ({
        ...prev,
        panVelocity: velocity,
        lastTouches: currentTouches
      }))
    }
  }, [touchGesture, getTouchDistance, getTouchCenter])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    if (!touchGesture.isActive || !touchGesture.initialTouches) return

    // Clear long press timer
    if (touchGesture.longPressTimer) {
      clearTimeout(touchGesture.longPressTimer)
    }

    const endTime = Date.now()
    const timeDelta = endTime - touchGesture.startTime

    if (touchGesture.gestureType === 'pan' && e.changedTouches.length === 1) {
      const initialTouch = touchGesture.initialTouches[0]
      const endTouch = e.changedTouches[0]
      
      const deltaX = endTouch.clientX - initialTouch.clientX
      const deltaY = endTouch.clientY - initialTouch.clientY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      // Detect swipe gesture
      if (distance > touchGesture.swipeThreshold && timeDelta < 300) {
        const velocity = getSwipeVelocity(initialTouch, endTouch, timeDelta)
        const direction = getSwipeDirection(initialTouch, endTouch)
        
        // Handle swipe actions
        if (velocity > 0.5) { // Minimum velocity threshold
          const canvasCoords = getCanvasCoordinates(endTouch.clientX, endTouch.clientY)
          const swipedSpark = state.sparks.find(spark => {
            const sparkX = spark.positionX || 0
            const sparkY = spark.positionY || 0
            return canvasCoords.x >= sparkX && canvasCoords.x <= sparkX + 256 &&
                   canvasCoords.y >= sparkY && canvasCoords.y <= sparkY + 200
          })
          
          if (swipedSpark) {
            switch (direction) {
              case 'left':
                // Quick select
                actions.selectSpark(swipedSpark)
                break
              case 'right':
                // Could implement quick edit
                actions.selectSpark(swipedSpark)
                break
              case 'up':
                // Could implement quick archive/complete
                break
              case 'down':
                // Could implement quick delete (with confirmation)
                break
            }
          }
        }
      }

      // Apply momentum to pan if velocity is significant
      if (Math.abs(touchGesture.panVelocity.x) > 0.1 || Math.abs(touchGesture.panVelocity.y) > 0.1) {
        const momentum = {
          x: touchGesture.panVelocity.x * 100,
          y: touchGesture.panVelocity.y * 100
        }
        
        // Apply boundary constraints
        setCanvasTransform(prev => {
          const maxX = 500, maxY = 500 // Adjust based on content bounds
          return {
            ...prev,
            x: Math.max(-maxX, Math.min(maxX, prev.x + momentum.x)),
            y: Math.max(-maxY, Math.min(maxY, prev.y + momentum.y))
          }
        })
      }
    }

    // Reset gesture state
    setTouchGesture({
      isActive: false,
      initialTouches: null,
      lastTouches: null,
      gestureType: 'none',
      startTime: 0,
      initialDistance: 0,
      currentScale: canvasTransform.scale,
      panVelocity: { x: 0, y: 0 },
      longPressTimer: null,
      swipeThreshold: 50
    })
  }, [touchGesture, getSwipeVelocity, getSwipeDirection, getCanvasCoordinates, state.sparks, actions, canvasTransform.scale])

  // Cleanup effect for timers
  useEffect(() => {
    return () => {
      if (touchGesture.longPressTimer) {
        clearTimeout(touchGesture.longPressTimer)
      }
    }
  }, [touchGesture.longPressTimer])

  // Calculate connection lines between sparks
  const getConnectionLines = useCallback((): ConnectionLine[] => {
    const lines: ConnectionLine[] = []

    state.sparks.forEach(spark => {
      if (spark.connections && spark.connections.length > 0) {
        spark.connections.forEach(connection => {
          const connectedSpark = state.sparks.find(s => s.id === connection.sparkId2)
          if (connectedSpark) {
            // Only create line once per connection (avoid duplicates)
            if (!lines.some(line =>
              (line.fromSparkId === spark.id && line.toSparkId === connectedSpark.id) ||
              (line.fromSparkId === connectedSpark.id && line.toSparkId === spark.id)
            )) {
              lines.push({
                id: `${spark.id}-${connectedSpark.id}`,
                fromSparkId: spark.id,
                toSparkId: connectedSpark.id,
                fromX: (spark.positionX || Math.random() * 600) + 128, // Center of card (card width is 256/2)
                fromY: (spark.positionY || Math.random() * 400) + 100, // Center of card (approximate height)
                toX: (connectedSpark.positionX || Math.random() * 600) + 128,
                toY: (connectedSpark.positionY || Math.random() * 400) + 100,
              })
            }
          }
        })
      }
    })

    return lines
  }, [state.sparks])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const spark = state.sparks.find(s => s.id === active.id)
    setActiveSpark(spark || null)
  }, [state.sparks])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, delta } = event

    const spark = state.sparks.find(s => s.id === active.id)
    if (spark) {
      // Calculate new position based on current position + drag delta
      const newPositionX = Math.max(0, (spark.positionX || 0) + delta.x)
      const newPositionY = Math.max(0, (spark.positionY || 0) + delta.y)

      await actions.updateSpark(spark.id, {
        positionX: newPositionX,
        positionY: newPositionY,
      })
    }

    setActiveSpark(null)
  }, [state.sparks, actions])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas, not on a spark
    if (e.target === e.currentTarget) {
      actions.selectSpark(null)
    }
  }, [actions])

  // Use filtered sparks from search context, fallback to all sparks if no filtering
  const sparksToDisplay = filteredSparks.length > 0 ? filteredSparks : state.sparks

  const connectionLines = getConnectionLines()

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={canvasRef}
        className="relative w-full h-full bg-gradient-to-br from-background to-muted/20 overflow-hidden touch-none"
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
          transformOrigin: '0 0',
          transition: touchGesture.isActive ? 'none' : 'transform 0.3s ease-out'
        }}
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

        {/* Connection Lines */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          {connectionLines.map((line) => (
            <line
              key={line.id}
              x1={line.fromX}
              y1={line.fromY}
              x2={line.toX}
              y2={line.toY}
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.3"
              className="text-primary"
              strokeDasharray="5,5"
            />
          ))}
          {/* Add circles at connection points for better visibility */}
          {connectionLines.map((line) => (
            <g key={`${line.id}-points`}>
              <circle
                cx={line.fromX}
                cy={line.fromY}
                r="4"
                fill="currentColor"
                className="text-primary"
                fillOpacity="0.6"
              />
              <circle
                cx={line.toX}
                cy={line.toY}
                r="4"
                fill="currentColor"
                className="text-primary"
                fillOpacity="0.6"
              />
            </g>
          ))}
        </svg>

        {/* Sparks */}
        {sparksToDisplay.map((spark) => (
          <div
            key={spark.id}
            className="absolute transition-all duration-200 hover:scale-105"
            style={{
              left: spark.positionX || Math.random() * 600,
              top: spark.positionY || Math.random() * 400,
              transform: state.selectedSpark?.id === spark.id ? 'scale(1.05)' : 'scale(1)',
              zIndex: state.selectedSpark?.id === spark.id ? 10 : 1,
            }}
          >
            <DraggableSparkCard
              spark={spark}
              isSelected={state.selectedSpark?.id === spark.id}
              onClick={() => actions.selectSpark(spark)}
            />
          </div>
        ))}

        {/* Empty state */}
        {sparksToDisplay.length === 0 && (
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


