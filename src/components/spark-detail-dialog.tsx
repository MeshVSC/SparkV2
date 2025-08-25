"use client"

import { useState, useEffect } from "react"
import { useSpark } from "@/contexts/spark-context"
import { Spark } from "@/types/spark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FileUploader } from "@/components/file-uploader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SparkStatus } from "@/types/spark"
import { X } from "lucide-react"

interface SparkDetailDialogProps {
  spark: Spark
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SparkDetailDialog({ spark, open, onOpenChange }: SparkDetailDialogProps) {
  const { actions } = useSpark()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    status: SparkStatus.SEEDLING,
    color: "#10b981",
    tags: [] as string[],
  })

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

  const colorOptions = [
    { name: "Green", value: "#10b981" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Pink", value: "#ec4899" },
    { name: "Orange", value: "#f97316" },
    { name: "Red", value: "#ef4444" },
  ]

  if (!spark) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Spark Details</DialogTitle>
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
                <SelectTrigger>
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
            <Textarea
              id="description"
              placeholder="Describe your spark..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Detailed content (markdown supported)..."
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              rows={6}
            />
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
  )
}