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
import { useState } from "react"

export function KanbanView() {
  const { state, actions } = useSpark()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

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
          <Card key={column.id} className="h-fit">
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
              {column.sparks.map((spark) => (
                <div
                  key={spark.id}
                  className="cursor-pointer"
                  onClick={() => actions.selectSpark(spark)}
                >
                  <SparkCard
                    spark={spark}
                    isSelected={state.selectedSpark?.id === spark.id}
                    onClick={() => actions.selectSpark(spark)}
                  />
                </div>
              ))}
              
              {column.sparks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <column.icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No {column.title.toLowerCase()}s yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateSparkDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}