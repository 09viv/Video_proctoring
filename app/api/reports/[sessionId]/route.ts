import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const stats = db.getSessionStats(params.sessionId)

    if (!stats) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Generate comprehensive report
    const report = {
      session: stats.session,
      summary: {
        candidateName: stats.session.candidateName,
        duration: `${Math.floor(stats.duration / 60)}:${(stats.duration % 60).toString().padStart(2, "0")}`,
        totalEvents: stats.events.length,
        integrityScore: stats.session.integrityScore,
        status: stats.session.status,
      },
      eventBreakdown: {
        byType: stats.eventsByType,
        bySeverity: stats.eventsBySeverity,
      },
      timeline: stats.events.map((event) => ({
        timestamp: event.timestamp,
        type: event.type,
        description: event.description,
        severity: event.severity,
      })),
      recommendations: generateRecommendations(stats),
      metadata: {
        generatedAt: new Date(),
        eventsPerMinute: Math.round(stats.eventsPerMinute * 100) / 100,
      },
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}

function generateRecommendations(stats: any): string[] {
  const recommendations: string[] = []

  if (stats.session.integrityScore >= 90) {
    recommendations.push("Excellent interview integrity maintained throughout the session.")
  } else if (stats.session.integrityScore >= 70) {
    recommendations.push("Good overall performance with minor integrity concerns.")
  } else if (stats.session.integrityScore >= 50) {
    recommendations.push("Moderate integrity issues detected. Review flagged events.")
  } else {
    recommendations.push("Significant integrity concerns. Manual review strongly recommended.")
  }

  if (stats.eventsByType.focus_loss > 3) {
    recommendations.push("Candidate frequently lost focus. Consider environment assessment.")
  }

  if (stats.eventsByType.suspicious_object > 0) {
    recommendations.push("Suspicious objects detected. Verify candidate workspace setup.")
  }

  if (stats.eventsByType.multiple_faces > 0) {
    recommendations.push("Multiple faces detected. Investigate potential unauthorized assistance.")
  }

  if (stats.eventsBySeverity.high > 2) {
    recommendations.push("Multiple high-severity events recorded. Detailed investigation required.")
  }

  return recommendations
}
