"use client"

import { useState } from "react"
import { useSpark } from "@/contexts/spark-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  Lightbulb, 
  Kanban, 
  Clock, 
  Settings,
  Sparkles,
  Target,
  Trophy
} from "lucide-react"
import { CreateSparkDialog } from "@/components/create-spark-dialog"
import { AchievementCenter } from "@/components/achievement-center"

export function Sidebar() {
  const { state, actions } = useSpark()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAchievementCenterOpen, setIsAchievementCenterOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    actions.setSearchQuery(searchInput)
  }

  const filteredSparks = state.sparks.filter(spark => {
    if (!state.searchQuery) return true
    const query = state.searchQuery.toLowerCase()
    return (
      spark.title.toLowerCase().includes(query) ||
      spark.description?.toLowerCase().includes(query) ||
      (spark.tags && spark.tags.toLowerCase().includes(query))
    )
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SEEDLING": return "bg-green-100 text-green-800"
      case "SAPLING": return "bg-blue-100 text-blue-800"
      case "TREE": return "bg-purple-100 text-purple-800"
      case "FOREST": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Spark</h1>
        </div>
        
        <form onSubmit={handleSearch} className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sparks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </form>

        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Spark
        </Button>
      </div>

      <Tabs defaultValue="sparks" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 m-2">
          <TabsTrigger value="sparks" className="text-xs">
            <Lightbulb className="h-3 w-3 mr-1" />
            Sparks
          </TabsTrigger>
          <TabsTrigger value="views" className="text-xs">
            <Kanban className="h-3 w-3 mr-1" />
            Views
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sparks" className="flex-1 overflow-hidden p-2">
          <div className="space-y-2 max-h-full overflow-y-auto">
            {filteredSparks.map((spark) => (
              <Card 
                key={spark.id} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => actions.selectSpark(spark)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm line-clamp-1">{spark.title}</h3>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(spark.status)}`}
                    >
                      {spark.status.toLowerCase()}
                    </Badge>
                  </div>
                  {spark.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {spark.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Lvl {spark.level}</span>
                    <span>{spark.xp} XP</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="views" className="flex-1 overflow-hidden p-2">
          <div className="space-y-2">
            <Card 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => actions.setViewMode("canvas")}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <div>
                    <h3 className="font-medium text-sm">Canvas View</h3>
                    <p className="text-xs text-muted-foreground">Free-form workspace</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => actions.setViewMode("kanban")}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Kanban className="h-4 w-4" />
                  <div>
                    <h3 className="font-medium text-sm">Kanban Board</h3>
                    <p className="text-xs text-muted-foreground">Workflow management</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => actions.setViewMode("timeline")}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <div>
                    <h3 className="font-medium text-sm">Timeline</h3>
                    <p className="text-xs text-muted-foreground">Chronological view</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="flex-1 overflow-hidden p-2">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Sparks</span>
                  <span className="font-medium">{state.sparks.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total XP</span>
                  <span className="font-medium">
                    {state.sparks.reduce((sum, spark) => sum + spark.xp, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Completed Todos</span>
                  <span className="font-medium">
                    {state.sparks.reduce((sum, spark) => 
                      sum + (spark.todos?.filter(todo => todo.completed).length || 0), 0
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Target className="h-3 w-3 mr-2" />
                  Daily Challenge
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setIsAchievementCenterOpen(true)}>
                  <Trophy className="h-3 w-3 mr-2" />
                  Achievement Center
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-3 w-3 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <CreateSparkDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
      />
      
      <AchievementCenter
        isOpen={isAchievementCenterOpen}
        onOpenChange={setIsAchievementCenterOpen}
      />
    </div>
  )
}