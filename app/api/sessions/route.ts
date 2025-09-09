import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { candidateName } = await request.json()

    if (!candidateName || typeof candidateName !== "string") {
      return NextResponse.json({ error: "Candidate name is required" }, { status: 400 })
    }

    const session = db.createSession(candidateName.trim())

    return NextResponse.json({
      success: true,
      session,
    })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sessions = db.getAllSessions()

    return NextResponse.json({
      success: true,
      sessions,
    })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}
