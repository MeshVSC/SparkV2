
"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Search, Filter, X, Tag, Calendar, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spark, SparkStatus } from "@/types/spark"
import { useSpark } from "@/contexts/spark-context"

interface SearchFilters {
  query: string
  tags: string[]
  status: SparkStatus | "all"
  dateFrom?: Date
  dateTo?: Date
  xpRange: [number, number]
}

interface AdvancedSearchProps {
  onFiltersChange: (filteredSparks: Spark[]) => void
}

export function AdvancedSearch({ onFiltersChange }: AdvancedSearchProps) {
  const { state } = useSpark()
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    tags: [],
    status: "all",
    xpRange: [0, 1000]
  })
  const [showFilters, setShowFilters] = useState(false)

  // Extract unique tags from all sparks
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    state.sparks.forEach(spark => {
      if (spark.tags) {
        try {
          const sparkTags = JSON.parse(spark.tags) as string[]
          sparkTags.forEach(tag => tagSet.add(tag))
        } catch (e) {
          // Handle string tags
          spark.tags.split(',').forEach(tag => tagSet.add(tag.trim()))
        }
      }
    })
    return Array.from(tagSet).filter(Boolean)
  }, [state.sparks])

  // Advanced search algorithm
  const filteredSparks = useMemo(() => {
    let results = state.sparks

    // Text search across multiple fields
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase()
      results = results.filter(spark => {
        const searchFields = [
          spark.title,
          spark.description || "",
          spark.content || "",
          ...(spark.todos?.map(todo => todo.title) || [])
        ].join(" ").toLowerCase()

        return searchFields.includes(query)
      })
    }

    // Tag filtering
    if (filters.tags.length > 0) {
      results = results.filter(spark => {
        if (!spark.tags) return false
        try {
          const sparkTags = JSON.parse(spark.tags) as string[]
          return filters.tags.some(filterTag => sparkTags.includes(filterTag))
        } catch (e) {
          const sparkTags = spark.tags.split(',').map(tag => tag.trim())
          return filters.tags.some(filterTag => sparkTags.includes(filterTag))
        }
      })
    }

    // Status filtering
    if (filters.status !== "all") {
      results = results.filter(spark => spark.status === filters.status)
    }

    // Date range filtering
    if (filters.dateFrom) {
      results = results.filter(spark => new Date(spark.createdAt) >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      results = results.filter(spark => new Date(spark.createdAt) <= filters.dateTo!)
    }

    // XP range filtering
    results = results.filter(spark => 
      spark.xp >= filters.xpRange[0] && spark.xp <= filters.xpRange[1]
    )

    return results
  }, [state.sparks, filters])

  // Notify parent component of filtered results
  useEffect(() => {
    onFiltersChange(filteredSparks)
  }, [filteredSparks, onFiltersChange])

  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }, [])

  const addTag = useCallback((tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilters({ tags: [...filters.tags, tag] })
    }
  }, [filters.tags, updateFilters])

  const removeTag = useCallback((tag: string) => {
    updateFilters({ tags: filters.tags.filter(t => t !== tag) })
  }, [filters.tags, updateFilters])

  const clearAllFilters = useCallback(() => {
    setFilters({
      query: "",
      tags: [],
      status: "all",
      xpRange: [0, 1000]
    })
  }, [])

  const hasActiveFilters = filters.query || filters.tags.length > 0 || 
    filters.status !== "all" || filters.dateFrom || filters.dateTo ||
    filters.xpRange[0] > 0 || filters.xpRange[1] < 1000

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search sparks, todos, content..."
          value={filters.query}
          onChange={(e) => updateFilters({ query: e.target.value })}
          className="pl-10 pr-10"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-1 top-1/2 transform -translate-y-1/2"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-4 border rounded-lg bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Advanced Filters</h3>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => updateFilters({ status: value as SparkStatus | "all" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SEEDLING">🌱 Seedling</SelectItem>
                <SelectItem value="SAPLING">🌿 Sapling</SelectItem>
                <SelectItem value="TREE">🌳 Tree</SelectItem>
                <SelectItem value="FOREST">🌲 Forest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  variant={filters.tags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => filters.tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {filters.dateFrom ? filters.dateFrom.toLocaleDateString() : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => updateFilters({ dateFrom: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {filters.dateTo ? filters.dateTo.toLocaleDateString() : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => updateFilters({ dateTo: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Found {filteredSparks.length} spark{filteredSparks.length !== 1 ? 's' : ''} matching your criteria
        </div>
      )}
    </div>
  )
}
