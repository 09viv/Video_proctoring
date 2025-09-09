// Simple in-memory database for demo purposes
// In production, replace with MongoDB, PostgreSQL, or Firebase

export interface ProctoringSession {
  id: string
  candidateName: string
  startTime: Date
  endTime?: Date
  status: "active" | "completed" | "terminated"
  totalEvents: number
  integrityScore: number
}

export interface ProctoringEvent {
  id: string
  sessionId: string
  type: "focus_loss" | "no_face" | "multiple_faces" | "suspicious_object"
  timestamp: Date
  description: string
  severity: "low" | "medium" | "high"
  metadata?: Record<string, any>
}

// In-memory storage (replace with real database in production)
class InMemoryDatabase {
  private sessions: Map<string, ProctoringSession> = new Map()
  private events: Map<string, ProctoringEvent[]> = new Map()

  // Session methods
  createSession(candidateName: string): ProctoringSession {
    const session: ProctoringSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      candidateName,
      startTime: new Date(),
      status: "active",
      totalEvents: 0,
      integrityScore: 100,
    }

    this.sessions.set(session.id, session)
    this.events.set(session.id, [])
    return session
  }

  getSession(sessionId: string): ProctoringSession | null {
    return this.sessions.get(sessionId) || null
  }

  updateSession(sessionId: string, updates: Partial<ProctoringSession>): ProctoringSession | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const updatedSession = { ...session, ...updates }
    this.sessions.set(sessionId, updatedSession)
    return updatedSession
  }

  getAllSessions(): ProctoringSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )
  }

  // Event methods
  addEvent(sessionId: string, event: Omit<ProctoringEvent, "id" | "sessionId">): ProctoringEvent {
    const fullEvent: ProctoringEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
    }

    const sessionEvents = this.events.get(sessionId) || []
    sessionEvents.push(fullEvent)
    this.events.set(sessionId, sessionEvents)

    // Update session stats
    const session = this.sessions.get(sessionId)
    if (session) {
      session.totalEvents = sessionEvents.length

      // Calculate integrity score based on events
      const severityWeights = { low: 2, medium: 5, high: 10 }
      const totalDeductions = sessionEvents.reduce((sum, evt) => sum + severityWeights[evt.severity], 0)
      session.integrityScore = Math.max(0, 100 - totalDeductions)

      this.sessions.set(sessionId, session)
    }

    return fullEvent
  }

  getEvents(sessionId: string): ProctoringEvent[] {
    return this.events.get(sessionId) || []
  }

  getEventsByType(sessionId: string, type: ProctoringEvent["type"]): ProctoringEvent[] {
    const events = this.events.get(sessionId) || []
    return events.filter((event) => event.type === type)
  }

  // Analytics methods
  getSessionStats(sessionId: string) {
    const events = this.events.get(sessionId) || []
    const session = this.sessions.get(sessionId)

    if (!session) return null

    const eventsByType = {
      focus_loss: events.filter((e) => e.type === "focus_loss").length,
      no_face: events.filter((e) => e.type === "no_face").length,
      multiple_faces: events.filter((e) => e.type === "multiple_faces").length,
      suspicious_object: events.filter((e) => e.type === "suspicious_object").length,
    }

    const eventsBySeverity = {
      low: events.filter((e) => e.severity === "low").length,
      medium: events.filter((e) => e.severity === "medium").length,
      high: events.filter((e) => e.severity === "high").length,
    }

    const duration = session.endTime
      ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
      : Date.now() - new Date(session.startTime).getTime()

    return {
      session,
      events,
      eventsByType,
      eventsBySeverity,
      duration: Math.round(duration / 1000), // in seconds
      eventsPerMinute: events.length / (duration / 60000),
    }
  }
}

// Export singleton instance
export const db = new InMemoryDatabase()
