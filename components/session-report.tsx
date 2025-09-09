"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Download,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Users,
  Smartphone,
  FileText,
  FileSpreadsheet,
} from "lucide-react"
import Link from "next/link"
import { ReportGenerator, type ReportData } from "@/lib/report-generator"

interface SessionReportProps {
  sessionId: string
}

export function SessionReport({ sessionId }: SessionReportProps) {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/reports/${sessionId}`)

        if (response.ok) {
          const data = await response.json()
          setReport(data.report)
        } else if (response.status === 404) {
          setError("Session not found")
        } else {
          setError("Failed to load report")
        }
      } catch (error) {
        console.error("Error fetching report:", error)
        setError("Failed to load report")
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [sessionId])

  const handleDownload = async (format: "json" | "csv" | "pdf") => {
    if (!report) return

    setDownloading(format)

    try {
      switch (format) {
        case "json":
          const reportData = {
            ...report,
            generatedAt: new Date().toISOString(),
          }
          const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `proctoring-report-${sessionId}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          break

        case "csv":
          ReportGenerator.downloadCSV(report, `proctoring-report-${sessionId}.csv`)
          break

        case "pdf":
          ReportGenerator.downloadPDF(report, `proctoring-report-${sessionId}`)
          break
      }
    } catch (error) {
      console.error(`Error downloading ${format} report:`, error)
    } finally {
      setDownloading(null)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "focus_loss":
        return <EyeOff className="h-4 w-4 text-orange-600" />
      case "no_face":
        return <Eye className="h-4 w-4 text-red-600" />
      case "multiple_faces":
        return <Users className="h-4 w-4 text-red-600" />
      case "suspicious_object":
        return <Smartphone className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getIntegrityScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error || "Report not found"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Proctoring Report</h1>
            <p className="text-muted-foreground">Session: {sessionId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => handleDownload("csv")} variant="outline" size="sm" disabled={downloading === "csv"}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {downloading === "csv" ? "Generating..." : "CSV"}
          </Button>
          <Button onClick={() => handleDownload("pdf")} variant="outline" size="sm" disabled={downloading === "pdf"}>
            <FileText className="h-4 w-4 mr-2" />
            {downloading === "pdf" ? "Generating..." : "PDF"}
          </Button>
          <Button onClick={() => handleDownload("json")} variant="outline" disabled={downloading === "json"}>
            <Download className="h-4 w-4 mr-2" />
            {downloading === "json" ? "Generating..." : "JSON"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Candidate</p>
                <p className="text-lg font-bold text-foreground">{report.summary.candidateName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p className="text-lg font-bold text-foreground">{report.summary.duration}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-lg font-bold text-orange-600">{report.summary.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Integrity Score</p>
                <p className={`text-lg font-bold ${getIntegrityScoreColor(report.summary.integrityScore)}`}>
                  {report.summary.integrityScore}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integrity Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className={`text-4xl font-bold ${getIntegrityScoreColor(report.summary.integrityScore)}`}>
              {report.summary.integrityScore}%
            </div>
            <div>
              <p className="text-lg font-medium">
                {report.summary.integrityScore >= 90
                  ? "Excellent Integrity"
                  : report.summary.integrityScore >= 70
                    ? "Good Integrity"
                    : report.summary.integrityScore >= 50
                      ? "Moderate Concerns"
                      : "Significant Issues"}
              </p>
              <p className="text-sm text-muted-foreground">
                Based on {report.summary.totalEvents} detected events during {report.summary.duration}
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                report.summary.integrityScore >= 90
                  ? "bg-green-500"
                  : report.summary.integrityScore >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${report.summary.integrityScore}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Event Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">By Type</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Focus Loss</span>
                  </div>
                  <Badge variant="secondary">{report.eventBreakdown.byType.focus_loss}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-red-600" />
                    <span className="text-sm">No Face</span>
                  </div>
                  <Badge variant="secondary">{report.eventBreakdown.byType.no_face}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Multiple Faces</span>
                  </div>
                  <Badge variant="secondary">{report.eventBreakdown.byType.multiple_faces}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Suspicious Objects</span>
                  </div>
                  <Badge variant="secondary">{report.eventBreakdown.byType.suspicious_object}</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">By Severity</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">High Severity</span>
                  <Badge className="bg-red-100 text-red-800">{report.eventBreakdown.bySeverity.high}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medium Severity</span>
                  <Badge className="bg-orange-100 text-orange-800">{report.eventBreakdown.bySeverity.medium}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low Severity</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{report.eventBreakdown.bySeverity.low}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.recommendations.map((recommendation, index) => (
                <Alert key={index} className="border-blue-200 bg-blue-50">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {report.timeline.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No events recorded</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {report.timeline.map((event, index) => (
                <Alert key={index} className={`border ${getSeverityColor(event.severity)}`}>
                  <div className="flex items-start gap-2">
                    {getEventIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <AlertDescription className="text-xs">
                        <div className="font-medium">{event.description}</div>
                        <div className="text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Report Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Generated At</p>
              <p className="text-foreground">{new Date(report.metadata.generatedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Events Per Minute</p>
              <p className="text-foreground">{report.metadata.eventsPerMinute.toFixed(2)}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Session Status</p>
              <Badge
                className={
                  report.session.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : report.session.status === "active"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {report.session.status.charAt(0).toUpperCase() + report.session.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
