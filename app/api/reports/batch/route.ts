import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { ReportGenerator } from "@/lib/report-generator"

export async function POST(request: NextRequest) {
  try {
    const { sessionIds, format = "csv" } = await request.json()

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json({ error: "Session IDs array is required" }, { status: 400 })
    }

    const reports = []

    for (const sessionId of sessionIds) {
      const stats = db.getSessionStats(sessionId)
      if (stats) {
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
            generatedAt: new Date().toISOString(),
            eventsPerMinute: Math.round(stats.eventsPerMinute * 100) / 100,
          },
        }
        reports.push(report)
      }
    }

    if (reports.length === 0) {
      return NextResponse.json({ error: "No valid sessions found" }, { status: 404 })
    }

    let content: string
    let contentType: string
    let filename: string

    switch (format) {
      case "summary":
        content = ReportGenerator.generateSummaryReport(reports)
        contentType = "text/csv"
        filename = `batch-summary-report-${new Date().toISOString().split("T")[0]}.csv`
        break
      case "csv":
      default:
        // Generate individual CSV reports concatenated
        content = reports.map((report) => ReportGenerator.generateCSV(report)).join("\n\n" + "=".repeat(80) + "\n\n")
        contentType = "text/csv"
        filename = `batch-reports-${new Date().toISOString().split("T")[0]}.csv`
        break
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error generating batch report:", error)
    return NextResponse.json({ error: "Failed to generate batch report" }, { status: 500 })
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
