import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, type, description, severity, metadata } = await request.json()

    if (!sessionId || !type || !description) {
      return NextResponse.json({ error: "Missing required fields: sessionId, type, description" }, { status: 400 })
    }

    const validTypes = ["focus_loss", "no_face", "multiple_faces", "suspicious_object"]
    const validSeverities = ["low", "medium", "high"]

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 })
    }

    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json({ error: "Invalid severity level" }, { status: 400 })
    }

    const event = db.addEvent(sessionId, {
      type,
      timestamp: new Date(),
      description,
      severity: severity || "medium",
      metadata,
    })

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const type = searchParams.get("type")

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId parameter is required" }, { status: 400 })
    }

    const events = type ? db.getEventsByType(sessionId, type as any) : db.getEvents(sessionId)

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
