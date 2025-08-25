import { NextRequest, NextResponse } from "next/server"
import { sparkMCPServer } from "@/lib/mcp/spark-mcp-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sparkId1, sparkId2 } = body

    if (!sparkId1 || !sparkId2) {
      return NextResponse.json(
        { error: "Both sparkId1 and sparkId2 are required" },
        { status: 400 }
      )
    }

    await sparkMCPServer.connectSparks(sparkId1, sparkId2)
    return NextResponse.json({ success: true, message: "Sparks connected successfully" })
  } catch (error) {
    console.error("MCP Error connecting sparks:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect sparks" },
      { status: 500 }
    )
  }
}