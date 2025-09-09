// Enhanced report generation utilities for PDF and CSV exports

export interface ReportData {
  session: {
    id: string
    candidateName: string
    startTime: string
    endTime?: string
    status: string
    totalEvents: number
    integrityScore: number
  }
  summary: {
    candidateName: string
    duration: string
    totalEvents: number
    integrityScore: number
    status: string
  }
  eventBreakdown: {
    byType: {
      focus_loss: number
      no_face: number
      multiple_faces: number
      suspicious_object: number
    }
    bySeverity: {
      low: number
      medium: number
      high: number
    }
  }
  timeline: Array<{
    timestamp: string
    type: string
    description: string
    severity: string
  }>
  recommendations: string[]
  metadata: {
    generatedAt: string
    eventsPerMinute: number
  }
}

export class ReportGenerator {
  static generateCSV(report: ReportData): string {
    const csvRows: string[] = []

    // Header information
    csvRows.push("PROCTORING INTEGRITY REPORT")
    csvRows.push("")
    csvRows.push("SESSION INFORMATION")
    csvRows.push(`Candidate Name,${report.session.candidateName}`)
    csvRows.push(`Session ID,${report.session.id}`)
    csvRows.push(`Start Time,${new Date(report.session.startTime).toLocaleString()}`)
    csvRows.push(`End Time,${report.session.endTime ? new Date(report.session.endTime).toLocaleString() : "N/A"}`)
    csvRows.push(`Duration,${report.summary.duration}`)
    csvRows.push(`Status,${report.session.status}`)
    csvRows.push(`Integrity Score,${report.session.integrityScore}%`)
    csvRows.push(`Total Events,${report.session.totalEvents}`)
    csvRows.push("")

    // Event breakdown by type
    csvRows.push("EVENT BREAKDOWN BY TYPE")
    csvRows.push("Event Type,Count")
    csvRows.push(`Focus Loss,${report.eventBreakdown.byType.focus_loss}`)
    csvRows.push(`No Face Detected,${report.eventBreakdown.byType.no_face}`)
    csvRows.push(`Multiple Faces,${report.eventBreakdown.byType.multiple_faces}`)
    csvRows.push(`Suspicious Objects,${report.eventBreakdown.byType.suspicious_object}`)
    csvRows.push("")

    // Event breakdown by severity
    csvRows.push("EVENT BREAKDOWN BY SEVERITY")
    csvRows.push("Severity Level,Count")
    csvRows.push(`High,${report.eventBreakdown.bySeverity.high}`)
    csvRows.push(`Medium,${report.eventBreakdown.bySeverity.medium}`)
    csvRows.push(`Low,${report.eventBreakdown.bySeverity.low}`)
    csvRows.push("")

    // Event timeline
    csvRows.push("EVENT TIMELINE")
    csvRows.push("Timestamp,Event Type,Severity,Description")
    report.timeline.forEach((event) => {
      const timestamp = new Date(event.timestamp).toLocaleString()
      const description = event.description.replace(/,/g, ";") // Replace commas to avoid CSV issues
      csvRows.push(`${timestamp},${event.type},${event.severity},${description}`)
    })
    csvRows.push("")

    // Recommendations
    csvRows.push("RECOMMENDATIONS")
    report.recommendations.forEach((rec, index) => {
      csvRows.push(`${index + 1}. ${rec.replace(/,/g, ";")}`)
    })
    csvRows.push("")

    // Metadata
    csvRows.push("REPORT METADATA")
    csvRows.push(`Generated At,${new Date(report.metadata.generatedAt).toLocaleString()}`)
    csvRows.push(`Events Per Minute,${report.metadata.eventsPerMinute.toFixed(2)}`)

    return csvRows.join("\n")
  }

  static generatePDFContent(report: ReportData): string {
    // Generate HTML content that can be converted to PDF
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Proctoring Integrity Report - ${report.session.candidateName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            padding: 10px;
            background: #f9fafb;
            border-radius: 5px;
        }
        .info-label {
            font-weight: bold;
            color: #6b7280;
        }
        .info-value {
            font-size: 1.2em;
            margin-top: 5px;
        }
        .score-excellent { color: #059669; }
        .score-good { color: #d97706; }
        .score-poor { color: #dc2626; }
        .event-timeline {
            background: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
        }
        .event-item {
            padding: 8px;
            margin: 5px 0;
            border-left: 4px solid #e5e7eb;
            background: white;
        }
        .event-high { border-left-color: #dc2626; }
        .event-medium { border-left-color: #d97706; }
        .event-low { border-left-color: #fbbf24; }
        .recommendations {
            background: #eff6ff;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #2563eb;
        }
        .recommendation-item {
            margin: 10px 0;
            padding-left: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
        }
        th {
            background: #f3f4f6;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Proctoring Integrity Report</h1>
        <p>Session ID: ${report.session.id}</p>
        <p>Generated on: ${new Date(report.metadata.generatedAt).toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>Session Summary</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Candidate Name</div>
                <div class="info-value">${report.session.candidateName}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Session Duration</div>
                <div class="info-value">${report.summary.duration}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Events</div>
                <div class="info-value">${report.session.totalEvents}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Integrity Score</div>
                <div class="info-value ${
                  report.session.integrityScore >= 90
                    ? "score-excellent"
                    : report.session.integrityScore >= 70
                      ? "score-good"
                      : "score-poor"
                }">${report.session.integrityScore}%</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Event Analysis</h2>
        <table>
            <tr>
                <th>Event Type</th>
                <th>Count</th>
                <th>Severity Breakdown</th>
            </tr>
            <tr>
                <td>Focus Loss</td>
                <td>${report.eventBreakdown.byType.focus_loss}</td>
                <td>Typically Medium Severity</td>
            </tr>
            <tr>
                <td>No Face Detected</td>
                <td>${report.eventBreakdown.byType.no_face}</td>
                <td>High Severity</td>
            </tr>
            <tr>
                <td>Multiple Faces</td>
                <td>${report.eventBreakdown.byType.multiple_faces}</td>
                <td>High Severity</td>
            </tr>
            <tr>
                <td>Suspicious Objects</td>
                <td>${report.eventBreakdown.byType.suspicious_object}</td>
                <td>High Severity</td>
            </tr>
        </table>
        
        <h3>Severity Distribution</h3>
        <p><strong>High Severity:</strong> ${report.eventBreakdown.bySeverity.high} events</p>
        <p><strong>Medium Severity:</strong> ${report.eventBreakdown.bySeverity.medium} events</p>
        <p><strong>Low Severity:</strong> ${report.eventBreakdown.bySeverity.low} events</p>
    </div>

    <div class="section">
        <h2>Event Timeline</h2>
        <div class="event-timeline">
            ${
              report.timeline.length === 0
                ? "<p>No events recorded during this session.</p>"
                : report.timeline
                    .map(
                      (event) => `
                <div class="event-item event-${event.severity}">
                    <strong>${new Date(event.timestamp).toLocaleTimeString()}</strong> - 
                    ${event.type.replace("_", " ").toUpperCase()}<br>
                    <small>${event.description}</small>
                </div>
              `,
                    )
                    .join("")
            }
        </div>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <div class="recommendations">
            ${report.recommendations
              .map(
                (rec, index) => `
                <div class="recommendation-item">
                    <strong>${index + 1}.</strong> ${rec}
                </div>
            `,
              )
              .join("")}
        </div>
    </div>

    <div class="section">
        <h2>Statistical Analysis</h2>
        <p><strong>Events per Minute:</strong> ${report.metadata.eventsPerMinute.toFixed(2)}</p>
        <p><strong>Session Status:</strong> ${report.session.status.charAt(0).toUpperCase() + report.session.status.slice(1)}</p>
        <p><strong>Start Time:</strong> ${new Date(report.session.startTime).toLocaleString()}</p>
        ${report.session.endTime ? `<p><strong>End Time:</strong> ${new Date(report.session.endTime).toLocaleString()}</p>` : ""}
    </div>

    <div class="footer">
        <p>This report was automatically generated by the Video Proctoring System</p>
        <p>For questions about this report, please contact your system administrator</p>
    </div>
</body>
</html>
    `
  }

  static downloadCSV(report: ReportData, filename?: string): void {
    const csvContent = this.generateCSV(report)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename || `proctoring-report-${report.session.id}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  static downloadPDF(report: ReportData, filename?: string): void {
    const htmlContent = this.generatePDFContent(report)
    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)

    // Open in new window for printing/saving as PDF
    const printWindow = window.open(url, "_blank")
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    }

    // Also provide direct download of HTML
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `proctoring-report-${report.session.id}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  static generateSummaryReport(reports: ReportData[]): string {
    const totalSessions = reports.length
    const completedSessions = reports.filter((r) => r.session.status === "completed").length
    const averageScore =
      totalSessions > 0 ? Math.round(reports.reduce((sum, r) => sum + r.session.integrityScore, 0) / totalSessions) : 0
    const totalEvents = reports.reduce((sum, r) => sum + r.session.totalEvents, 0)
    const highRiskSessions = reports.filter((r) => r.session.integrityScore < 70).length

    const csvRows: string[] = []
    csvRows.push("PROCTORING SYSTEM SUMMARY REPORT")
    csvRows.push("")
    csvRows.push("OVERVIEW STATISTICS")
    csvRows.push(`Total Sessions,${totalSessions}`)
    csvRows.push(`Completed Sessions,${completedSessions}`)
    csvRows.push(`Average Integrity Score,${averageScore}%`)
    csvRows.push(`Total Events Across All Sessions,${totalEvents}`)
    csvRows.push(`High Risk Sessions (Score < 70%),${highRiskSessions}`)
    csvRows.push("")

    csvRows.push("SESSION DETAILS")
    csvRows.push("Candidate Name,Session ID,Integrity Score,Total Events,Status,Duration")
    reports.forEach((report) => {
      csvRows.push(
        `${report.session.candidateName},${report.session.id},${report.session.integrityScore}%,${report.session.totalEvents},${report.session.status},${report.summary.duration}`,
      )
    })

    csvRows.push("")
    csvRows.push(`Generated At,${new Date().toLocaleString()}`)

    return csvRows.join("\n")
  }
}
