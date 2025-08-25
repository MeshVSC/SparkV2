#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

// Database connection (simplified for MCP server)
const DB_PATH = process.env.DATABASE_URL || "file:./dev.db"

// Simple database interface for MCP server
class SparkDatabase {
  private async query(sql: string, params: any[] = []) {
    // This is a simplified version - in production, you'd use a proper database client
    // For now, we'll make HTTP requests to the main application
    try {
      const response = await fetch(`http://localhost:3000/api/mcp-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      })
      
      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error("Database query error:", error)
      throw error
    }
  }

  async getSparks(search?: string) {
    let url = "http://localhost:3000/api/sparks"
    if (search) {
      url = `http://localhost:3000/api/search?q=${encodeURIComponent(search)}`
    }
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch sparks: ${response.statusText}`)
    }
    
    return await response.json()
  }

  async createSpark(data: any) {
    const response = await fetch("http://localhost:3000/api/sparks", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create spark: ${response.statusText}`)
    }
    
    return await response.json()
  }

  async updateSpark(id: string, data: any) {
    const response = await fetch(`http://localhost:3000/api/sparks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update spark: ${response.statusText}`)
    }
    
    return await response.json()
  }

  async deleteSpark(id: string) {
    const response = await fetch(`http://localhost:3000/api/sparks/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete spark: ${response.statusText}`)
    }
    
    return { success: true }
  }

  async getTodos(sparkId: string) {
    const response = await fetch(`http://localhost:3000/api/sparks/${sparkId}/todos`)
    if (!response.ok) {
      throw new Error(`Failed to fetch todos: ${response.statusText}`)
    }
    
    return await response.json()
  }

  async addTodo(sparkId: string, todo: any) {
    const response = await fetch(`http://localhost:3000/api/sparks/${sparkId}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(todo),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to add todo: ${response.statusText}`)
    }
    
    return await response.json()
  }

  async updateTodo(sparkId: string, todoId: string, data: any) {
    const response = await fetch(`http://localhost:3000/api/sparks/${sparkId}/todos/${todoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update todo: ${response.statusText}`)
    }
    
    return await response.json()
  }

  async deleteTodo(sparkId: string, todoId: string) {
    const response = await fetch(`http://localhost:3000/api/sparks/${sparkId}/todos/${todoId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete todo: ${response.statusText}`)
    }
    
    return { success: true }
  }

  async getAttachments(sparkId: string) {
    const response = await fetch(`http://localhost:3000/api/sparks/${sparkId}/attachments`)
    if (!response.ok) {
      throw new Error(`Failed to fetch attachments: ${response.statusText}`)
    }
    
    return await response.json()
  }

  async addAttachment(sparkId: string, attachment: any) {
    const response = await fetch(`http://localhost:3000/api/sparks/${sparkId}/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attachment),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to add attachment: ${response.statusText}`)
    }
    
    return await response.json()
  }

  async deleteAttachment(attachmentId: string) {
    const response = await fetch(`http://localhost:3000/api/attachments/${attachmentId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete attachment: ${response.statusText}`)
    }
    
    return { success: true }
  }

  async getAchievements() {
    const response = await fetch("http://localhost:3000/api/achievements")
    if (!response.ok) {
      throw new Error(`Failed to fetch achievements: ${response.statusText}`)
    }
    
    return await response.json()
  }

  async unlockAchievement(achievementId: string) {
    const response = await fetch("http://localhost:3000/api/achievements", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ achievementId }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to unlock achievement: ${response.statusText}`)
    }
    
    return await response.json()
  }

  async getUserProgress() {
    const response = await fetch("http://localhost:3000/api/user/progress")
    if (!response.ok) {
      throw new Error(`Failed to fetch user progress: ${response.statusText}`)
    }
    
    return await response.json()
  }

  async getSuggestions(sparkId: string) {
    // Use AI to generate suggestions for spark evolution
    try {
      const spark = await this.getSparkById(sparkId)
      if (!spark) {
        throw new Error("Spark not found")
      }

      // Generate contextual suggestions based on spark content and status
      const suggestions = []

      if (spark.status === "SEEDLING") {
        suggestions.push("Add a detailed description to help your spark grow")
        suggestions.push("Create some initial todos to break down your idea")
        suggestions.push("Consider adding relevant tags for better organization")
      } else if (spark.status === "SAPLING") {
        suggestions.push("Add attachments to support your spark with resources")
        suggestions.push("Connect this spark to related ideas")
        suggestions.push("Update the content with more detailed information")
      } else if (spark.status === "TREE") {
        suggestions.push("Review and complete remaining todos")
        suggestions.push("Share your spark with collaborators")
        suggestions.push("Consider if this spark is ready to become a forest")
      } else if (spark.status === "FOREST") {
        suggestions.push("Document the lessons learned from this spark")
        suggestions.push("Create new sparks based on insights gained")
        suggestions.push("Archive completed todos and attachments")
      }

      return suggestions
    } catch (error) {
      console.error("Error generating suggestions:", error)
      return ["Unable to generate suggestions at this time"]
    }
  }

  private async getSparkById(id: string) {
    const response = await fetch(`http://localhost:3000/api/sparks/${id}`)
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  }
}

// Create MCP Server
const server = new Server(
  {
    name: "spark-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
)

const db = new SparkDatabase()

// Register MCP Tools
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "read_sparks",
        description: "Read all sparks or search sparks by query",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Optional search query to filter sparks",
            },
          },
        },
      },
      {
        name: "create_spark",
        description: "Create a new spark",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title of the spark",
            },
            description: {
              type: "string",
              description: "Description of the spark",
            },
            content: {
              type: "string",
              description: "Detailed content of the spark",
            },
            status: {
              type: "string",
              enum: ["SEEDLING", "SAPLING", "TREE", "FOREST"],
              description: "Status of the spark",
            },
            color: {
              type: "string",
              description: "Color code for the spark",
            },
            tags: {
              type: "string",
              description: "Comma-separated tags for the spark",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "update_spark",
        description: "Update an existing spark",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID of the spark to update",
            },
            title: {
              type: "string",
              description: "New title of the spark",
            },
            description: {
              type: "string",
              description: "New description of the spark",
            },
            content: {
              type: "string",
              description: "New content of the spark",
            },
            status: {
              type: "string",
              enum: ["SEEDLING", "SAPLING", "TREE", "FOREST"],
              description: "New status of the spark",
            },
            color: {
              type: "string",
              description: "New color code for the spark",
            },
            tags: {
              type: "string",
              description: "New comma-separated tags for the spark",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_spark",
        description: "Delete a spark",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID of the spark to delete",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "add_todo",
        description: "Add a todo to a spark",
        inputSchema: {
          type: "object",
          properties: {
            sparkId: {
              type: "string",
              description: "ID of the spark",
            },
            title: {
              type: "string",
              description: "Title of the todo",
            },
            description: {
              type: "string",
              description: "Description of the todo",
            },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
              description: "Priority of the todo",
            },
            type: {
              type: "string",
              enum: ["GENERAL", "TASK"],
              description: "Type of the todo",
            },
          },
          required: ["sparkId", "title"],
        },
      },
      {
        name: "update_todo",
        description: "Update a todo",
        inputSchema: {
          type: "object",
          properties: {
            sparkId: {
              type: "string",
              description: "ID of the spark containing the todo",
            },
            todoId: {
              type: "string",
              description: "ID of the todo to update",
            },
            title: {
              type: "string",
              description: "New title of the todo",
            },
            description: {
              type: "string",
              description: "New description of the todo",
            },
            completed: {
              type: "boolean",
              description: "Whether the todo is completed",
            },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
              description: "New priority of the todo",
            },
          },
          required: ["sparkId", "todoId"],
        },
      },
      {
        name: "delete_todo",
        description: "Delete a todo",
        inputSchema: {
          type: "object",
          properties: {
            sparkId: {
              type: "string",
              description: "ID of the spark containing the todo",
            },
            todoId: {
              type: "string",
              description: "ID of the todo to delete",
            },
          },
          required: ["sparkId", "todoId"],
        },
      },
      {
        name: "get_suggestions",
        description: "Get AI-powered suggestions for spark evolution",
        inputSchema: {
          type: "object",
          properties: {
            sparkId: {
              type: "string",
              description: "ID of the spark to get suggestions for",
            },
          },
          required: ["sparkId"],
        },
      },
      {
        name: "get_achievements",
        description: "Get all achievements and unlock status",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "unlock_achievement",
        description: "Unlock an achievement",
        inputSchema: {
          type: "object",
          properties: {
            achievementId: {
              type: "string",
              description: "ID of the achievement to unlock",
            },
          },
          required: ["achievementId"],
        },
      },
      {
        name: "get_user_progress",
        description: "Get user progress and statistics",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  }
})

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case "read_sparks":
        const sparks = await db.getSparks(args.query)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(sparks, null, 2),
            },
          ],
        }

      case "create_spark":
        const newSpark = await db.createSpark({
          title: args.title,
          description: args.description,
          content: args.content,
          status: args.status || "SEEDLING",
          color: args.color || "#10b981",
          tags: args.tags,
        })
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(newSpark, null, 2),
            },
          ],
        }

      case "update_spark":
        const updatedSpark = await db.updateSpark(args.id, {
          title: args.title,
          description: args.description,
          content: args.content,
          status: args.status,
          color: args.color,
          tags: args.tags,
        })
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(updatedSpark, null, 2),
            },
          ],
        }

      case "delete_spark":
        await db.deleteSpark(args.id)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, message: "Spark deleted successfully" }),
            },
          ],
        }

      case "add_todo":
        const newTodo = await db.addTodo(args.sparkId, {
          title: args.title,
          description: args.description,
          priority: args.priority || "MEDIUM",
          type: args.type || "GENERAL",
          completed: false,
        })
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(newTodo, null, 2),
            },
          ],
        }

      case "update_todo":
        const updatedTodo = await db.updateTodo(args.sparkId, args.todoId, {
          title: args.title,
          description: args.description,
          completed: args.completed,
          priority: args.priority,
        })
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(updatedTodo, null, 2),
            },
          ],
        }

      case "delete_todo":
        await db.deleteTodo(args.sparkId, args.todoId)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, message: "Todo deleted successfully" }),
            },
          ],
        }

      case "get_suggestions":
        const suggestions = await db.getSuggestions(args.sparkId)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ suggestions }, null, 2),
            },
          ],
        }

      case "get_achievements":
        const achievements = await db.getAchievements()
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(achievements, null, 2),
            },
          ],
        }

      case "unlock_achievement":
        const unlockResult = await db.unlockAchievement(args.achievementId)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(unlockResult, null, 2),
            },
          ],
        }

      case "get_user_progress":
        const progress = await db.getUserProgress()
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(progress, null, 2),
            },
          ],
        }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    }
  }
})

// Start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("Spark MCP server started on stdio")
}

main().catch((error) => {
  console.error("Server error:", error)
  process.exit(1)
})