"use client"

import React, { createContext, useContext, useReducer, useEffect } from "react"
import { Spark, Todo, Attachment, CreateSparkData } from "@/types/spark"
import { AchievementService } from "@/lib/achievement-service"
import { sparkApi } from "@/lib/api/spark-api"

interface SparkState {
  sparks: Spark[]
  selectedSpark: Spark | null
  isLoading: boolean
  error: string | null
  viewMode: "canvas" | "kanban" | "timeline"
  searchQuery: string
  userStats: any | null
}

type SparkAction =
  | { type: "SET_SPARKS"; payload: Spark[] }
  | { type: "ADD_SPARK"; payload: Spark }
  | { type: "UPDATE_SPARK"; payload: Spark }
  | { type: "DELETE_SPARK"; payload: string }
  | { type: "SET_SELECTED_SPARK"; payload: Spark | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_VIEW_MODE"; payload: "canvas" | "kanban" | "timeline" }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_USER_STATS"; payload: any }
  | { type: "ADD_TODO"; payload: { sparkId: string; todo: Todo } }
  | { type: "UPDATE_TODO"; payload: { sparkId: string; todo: Todo } }
  | { type: "DELETE_TODO"; payload: { sparkId: string; todoId: string } }
  | { type: "ADD_ATTACHMENT"; payload: { sparkId: string; attachment: Attachment } }
  | { type: "DELETE_ATTACHMENT"; payload: { sparkId: string; attachmentId: string } }

const initialState: SparkState = {
  sparks: [],
  selectedSpark: null,
  isLoading: false,
  error: null,
  viewMode: "canvas",
  searchQuery: "",
  userStats: null,
}

function sparkReducer(state: SparkState, action: SparkAction): SparkState {
  switch (action.type) {
    case "SET_SPARKS":
      return { ...state, sparks: action.payload }
    
    case "ADD_SPARK":
      return { ...state, sparks: [...state.sparks, action.payload] }
    
    case "UPDATE_SPARK":
      return {
        ...state,
        sparks: state.sparks.map(spark =>
          spark.id === action.payload.id ? action.payload : spark
        ),
        selectedSpark: state.selectedSpark?.id === action.payload.id 
          ? action.payload 
          : state.selectedSpark,
      }
    
    case "DELETE_SPARK":
      return {
        ...state,
        sparks: state.sparks.filter(spark => spark.id !== action.payload),
        selectedSpark: state.selectedSpark?.id === action.payload ? null : state.selectedSpark,
      }
    
    case "SET_SELECTED_SPARK":
      return { ...state, selectedSpark: action.payload }
    
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    
    case "SET_ERROR":
      return { ...state, error: action.payload }
    
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload }
    
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload }
    
    case "SET_USER_STATS":
      return { ...state, userStats: action.payload }
    
    case "ADD_TODO":
      return {
        ...state,
        sparks: state.sparks.map(spark =>
          spark.id === action.payload.sparkId
            ? { ...spark, todos: [...(spark.todos || []), action.payload.todo] }
            : spark
        ),
      }
    
    case "UPDATE_TODO":
      return {
        ...state,
        sparks: state.sparks.map(spark =>
          spark.id === action.payload.sparkId
            ? {
                ...spark,
                todos: spark.todos?.map(todo =>
                  todo.id === action.payload.todo.id ? action.payload.todo : todo
                ) || [],
              }
            : spark
        ),
      }
    
    case "DELETE_TODO":
      return {
        ...state,
        sparks: state.sparks.map(spark =>
          spark.id === action.payload.sparkId
            ? {
                ...spark,
                todos: spark.todos?.filter(todo => todo.id !== action.payload.todoId) || [],
              }
            : spark
        ),
      }
    
    case "ADD_ATTACHMENT":
      return {
        ...state,
        sparks: state.sparks.map(spark =>
          spark.id === action.payload.sparkId
            ? { 
                ...spark, 
                attachments: [...(spark.attachments || []), action.payload.attachment] 
              }
            : spark
        ),
      }
    
    case "DELETE_ATTACHMENT":
      return {
        ...state,
        sparks: state.sparks.map(spark =>
          spark.id === action.payload.sparkId
            ? {
                ...spark,
                attachments: spark.attachments?.filter(att => att.id !== action.payload.attachmentId) || [],
              }
            : spark
        ),
      }
    
    default:
      return state
  }
}

interface SparkContextType {
  state: SparkState
  dispatch: React.Dispatch<SparkAction>
  actions: {
    loadSparks: () => Promise<void>
    createSpark: (spark: CreateSparkData) => Promise<void>
    updateSpark: (id: string, updates: Partial<Spark>) => Promise<void>
    deleteSpark: (id: string) => Promise<void>
    selectSpark: (spark: Spark | null) => void
    setViewMode: (mode: "canvas" | "kanban" | "timeline") => void
    setSearchQuery: (query: string) => void
    addTodo: (sparkId: string, todo: Omit<Todo, "id" | "createdAt">) => Promise<void>
    updateTodo: (sparkId: string, todoId: string, updates: Partial<Todo>) => Promise<void>
    deleteTodo: (sparkId: string, todoId: string) => Promise<void>
    uploadAttachment: (sparkId: string, file: File) => Promise<void>
    deleteAttachment: (sparkId: string, attachmentId: string) => Promise<void>
  }
}

const SparkContext = createContext<SparkContextType | undefined>(undefined)

export function SparkProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sparkReducer, initialState)

  const actions = {
    loadSparks: async () => {
      dispatch({ type: "SET_LOADING", payload: true })
      try {
        const sparks = await sparkApi.getAll()
        dispatch({ type: "SET_SPARKS", payload: sparks })
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load sparks" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    },

    createSpark: async (sparkData: CreateSparkData) => {
      try {
        const spark = await sparkApi.create(sparkData)
        dispatch({ type: "ADD_SPARK", payload: spark })
      } catch (error) {
        console.error("SparkContext: Error creating spark:", error)
        dispatch({ type: "SET_ERROR", payload: "Failed to create spark" })
        throw error // Re-throw to let the dialog handle it
      }
    },

    updateSpark: async (id: string, updates: Partial<Spark>) => {
      try {
        const spark = await sparkApi.update(id, updates)
        dispatch({ type: "UPDATE_SPARK", payload: spark })
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to update spark" })
      }
    },

    deleteSpark: async (id: string) => {
      try {
        await sparkApi.delete(id)
        dispatch({ type: "DELETE_SPARK", payload: id })
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to delete spark" })
      }
    },

    selectSpark: (spark: Spark | null) => {
      dispatch({ type: "SET_SELECTED_SPARK", payload: spark })
    },

    setViewMode: (mode: "canvas" | "kanban" | "timeline") => {
      dispatch({ type: "SET_VIEW_MODE", payload: mode })
    },

    setSearchQuery: (query: string) => {
      dispatch({ type: "SET_SEARCH_QUERY", payload: query })
    },

    addTodo: async (sparkId: string, todoData: Omit<Todo, "id" | "createdAt">) => {
      try {
        const todo = await sparkApi.addTodo(sparkId, todoData)
        dispatch({ type: "ADD_TODO", payload: { sparkId, todo } })
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to add todo" })
      }
    },

    updateTodo: async (sparkId: string, todoId: string, updates: Partial<Todo>) => {
      try {
        const todo = await sparkApi.updateTodo(sparkId, todoId, updates)
        dispatch({ type: "UPDATE_TODO", payload: { sparkId, todo } })
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to update todo" })
      }
    },

    deleteTodo: async (sparkId: string, todoId: string) => {
      try {
        await sparkApi.deleteTodo(sparkId, todoId)
        dispatch({ type: "DELETE_TODO", payload: { sparkId, todoId } })
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to delete todo" })
      }
    },

    uploadAttachment: async (sparkId: string, file: File) => {
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "FILE")

        const response = await fetch(`/api/sparks/${sparkId}/attachments`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Failed to upload attachment")
        }

        const attachment = await response.json()
        dispatch({ type: "ADD_ATTACHMENT", payload: { sparkId, attachment } })
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to upload attachment" })
      }
    },

    deleteAttachment: async (sparkId: string, attachmentId: string) => {
      try {
        await fetch(`/api/attachments/${attachmentId}`, {
          method: "DELETE",
        })
        dispatch({ type: "DELETE_ATTACHMENT", payload: { sparkId, attachmentId } })
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to delete attachment" })
      }
    },
  }

  useEffect(() => {
    actions.loadSparks()
  }, [])

  return (
    <SparkContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </SparkContext.Provider>
  )
}

export function useSpark() {
  const context = useContext(SparkContext)
  if (context === undefined) {
    throw new Error("useSpark must be used within a SparkProvider")
  }
  return context
}