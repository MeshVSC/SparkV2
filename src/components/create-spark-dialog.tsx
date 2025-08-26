"use client"

import { useState } from "react"
import { useSpark } from "@/contexts/spark-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SparkStatus } from "@/types/spark"

interface CreateSparkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStatus?: SparkStatus
}

export function CreateSparkDialog({ open, onOpenChange, initialStatus }: CreateSparkDialogProps) {
  const { actions } = useSpark()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: initialStatus || SparkStatus.SEEDLING,
    color: "#10b981",
    tags: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) return

    const sparkData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      xp: 0,
      level: 1,
      color: formData.color,
      tags: formData.tags.trim() || undefined,
      positionX: Math.random() * 500,
      positionY: Math.random() * 500,
    }

    try {
      await actions.createSpark(sparkData)
      
      // Refresh user stats after XP award
      actions.loadUserStats()
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        status: SparkStatus.SEEDLING,
        color: "#10b981",
        tags: "",
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating spark:", error)
      alert("Failed to create spark. Please try again.")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const colorOptions = [
    { name: "Green", value: "#10b981" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Pink", value: "#ec4899" },
    { name: "Orange", value: "#f97316" },
    { name: "Red", value: "#ef4444" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Spark</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
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
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Enter tags separated by commas..."
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.title.trim()}>
              Create Spark
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}