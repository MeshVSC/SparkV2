"use client"

import { useState, useEffect } from "react"
import { useSpark } from "@/contexts/spark-context"
import { Spark } from "@/types/spark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FileUploader } from "@/components/file-uploader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SparkStatus } from "@/types/spark"
import { AddTodoDialog } from "@/components/add-todo-dialog"
import { X, Link, Link2, Plus, Target } from "lucide-react"
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  ListsToggle,
  InsertTable,
} from "@mdxeditor/editor"
import "@mdxeditor/editor/style.css"

interface SparkDetailDialogProps {
  spark: Spark
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SparkDetailDialog({ spark, open, onOpenChange }: SparkDetailDialogProps) {
  const { state, actions } = useSpark()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    status: SparkStatus.SEEDLING,
    color: "#10b981",
    tags: [] as string[],
  })
  const [editorRef, setEditorRef] = useState<MDXEditorMethods | null>(null)
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [selectedSparkToConnect, setSelectedSparkToConnect] = useState<string>("")
  const [showTodoDialog, setShowTodoDialog] = useState(false)

  useEffect(() => {
    if (spark) {
      setFormData({
        title: spark.title,
        description: spark.description || "",
        content: spark.content || "",
        status: spark.status,
        color: spark.color,
        tags: spark.tags ? JSON.parse(spark.tags) : [],
      })
    }
  }, [spark])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) return

    const updates = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      content: formData.content.trim() || undefined,
      status: formData.status,
      color: formData.color,
      tags: formData.tags.length > 0 ? JSON.stringify(formData.tags) : undefined,
    }

    await actions.updateSpark(spark.id, updates)
    onOpenChange(false)
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      handleInputChange("tags", [...formData.tags, tag.trim()])
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange("tags", formData.tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag((e.target as HTMLInputElement).value)
      ;(e.target as HTMLInputElement).value = ""
    }
  }

  const handleConnectSpark = async () => {
    if (!selectedSparkToConnect) return

    try {
      const response = await fetch("/api/mcp/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sparkId1: spark.id,
          sparkId2: selectedSparkToConnect,
        }),
      })

      if (response.ok) {
        // Refresh sparks to get updated connections
        await actions.loadSparks()
        setShowConnectionDialog(false)
        setSelectedSparkToConnect("")
      }
    } catch (error) {
      console.error("Error connecting sparks:", error)
    }
  }

  const getConnectedSparks = () => {
    if (!spark.connections) return []
    
    return spark.connections
      .map(connection => {
        const connectedSpark = state.sparks.find(s => s.id === connection.sparkId2)
        return connectedSpark
      })
      .filter(Boolean)
  }

  const getAvailableSparksToConnect = () => {
    return state.sparks.filter(s => 
      s.id !== spark.id && 
      !getConnectedSparks().some(connected => connected.id === s.id)
    )
  }

  const colorOptions = [
    { name: "Green", value: "#10b981" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Pink", value: "#ec4899" },
    { name: "Orange", value: "#f97316" },
    { name: "Red", value: "#ef4444" },
  ]

  if (!spark) return null

  const connectedSparks = getConnectedSparks()
  const availableSparks = getAvailableSparksToConnect()

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Spark Details</DialogTitle>
            <DialogDescription>
              Update your spark's information, content, and settings. Changes are saved automatically.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter spark title..."
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SparkStatus.SEEDLING}>Seedling</SelectItem>
                    <SelectItem value={SparkStatus.SAPLING}>Sapling</SelectItem>
                    <SelectItem value={SparkStatus.TREE}>Tree</SelectItem>
                    <SelectItem value={SparkStatus.FOREST}>Forest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Describe your spark..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <div className="border rounded-md overflow-hidden">
                <MDXEditor
                  ref={setEditorRef}
                  markdown={formData.content}
                  onChange={(markdown) => handleInputChange("content", markdown || "")}
                  plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    markdownShortcutPlugin(),
                    linkPlugin(),
                    linkDialogPlugin(),
                    imagePlugin(),
                    tablePlugin(),
                    toolbarPlugin({
                      toolbarContents: () => (
                        <>
                          <UndoRedo />
                          <BoldItalicUnderlineToggles />
                          <BlockTypeSelect />
                          <CreateLink />
                          <ListsToggle />
                          <InsertImage />
                          <InsertTable />
                        </>
                      ),
                    }),
                  ]}
                  contentEditableClassName="prose max-w-full min-h-[200px] p-4 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-10 h-10 rounded-full border-2 ${
                      formData.color === color.value ? "border-primary" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleInputChange("color", color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Connections Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Connected Sparks
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConnectionDialog(true)}
                  disabled={availableSparks.length === 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Connect
                </Button>
              </div>
              
              {connectedSparks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {connectedSparks.map((connectedSpark) => (
                    <Badge key={connectedSpark.id} variant="secondary" className="text-sm">
                      <Link className="w-3 h-3 mr-1" />
                      {connectedSpark.title}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No connections yet. Connect this spark to related ideas!</p>
              )}
            </div>

            {/* Todos Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Todos
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTodoDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Todo
                </Button>
              </div>
              
              {spark.todos && spark.todos.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {spark.todos.map((todo) => (
                    <div key={todo.id} className="flex items-center gap-2 p-2 border rounded">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={(e) => actions.updateTodo(spark.id, todo.id, { completed: e.target.checked })}
                        className="rounded"
                      />
                      <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {todo.title}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => actions.deleteTodo(spark.id, todo.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No todos yet. Add one to get started!</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tags (press Enter)..."
                onKeyPress={handleTagKeyPress}
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Level</div>
                  <div className="font-medium">{spark.level}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">XP</div>
                  <div className="font-medium">{spark.xp}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Todos</div>
                  <div className="font-medium">{spark.todos?.length || 0}</div>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-2">
              <Label>Attachments</Label>
              <FileUploader 
                sparkId={spark.id} 
                attachments={spark.attachments || []} 
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.title.trim()}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Connection Dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Connect to Another Spark</DialogTitle>
            <DialogDescription>
              Create a connection between related sparks to build a network of ideas and track their relationships.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select a spark to connect with</Label>
              <Select value={selectedSparkToConnect} onValueChange={setSelectedSparkToConnect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a spark..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSparks.map((availableSpark) => (
                    <SelectItem key={availableSpark.id} value={availableSpark.id}>
                      {availableSpark.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConnectionDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConnectSpark}
                disabled={!selectedSparkToConnect}
              >
                Connect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Todo Dialog */}
      <AddTodoDialog 
        open={showTodoDialog} 
        onOpenChange={setShowTodoDialog}
        onAddTodo={(todoData) => actions.addTodo(spark.id, todoData)}
      />
    </>
  )
}