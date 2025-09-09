"use client"

import { useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, AlertTriangle, Eye, EyeOff, Brain, Scan } from "lucide-react"
import { useFaceDetection } from "./face-detection"
import { useObjectDetection } from "./object-detection"
import Link from "next/link"
import { BarChart3 } from "lucide-react"

interface ProctoringEvent {
  id: string
  type: "focus_loss" | "no_face" | "multiple_faces" | "suspicious_object"
  timestamp: Date
  description: string
  severity: "low" | "medium" | "high"
}

export function VideoProctoring() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [events, setEvents] = useState<ProctoringEvent[]>([])
  const [currentStatus, setCurrentStatus] = useState<string>("Ready to start")
  const [candidateName, setCandidateName] = useState("")
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const [faceDetectionStats, setFaceDetectionStats] = useState({
    currentFaces: 0,
    isLookingAway: false,
    confidence: 0,
    lastFaceTime: Date.now(),
    lookAwayStartTime: null as number | null,
  })

  const [objectDetectionStats, setObjectDetectionStats] = useState({
    currentObjects: [] as string[],
    suspiciousCount: 0,
    lastDetectionTime: Date.now(),
  })

  const logEventToBackend = async (
    type: ProctoringEvent["type"],
    description: string,
    severity: ProctoringEvent["severity"] = "medium",
  ) => {
    if (!currentSessionId) return

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          type,
          description,
          severity,
          metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          },
        }),
      })

      if (!response.ok) {
        console.error("Failed to log event to backend")
      }
    } catch (error) {
      console.error("Error logging event:", error)
    }
  }

  const addEvent = (
    type: ProctoringEvent["type"],
    description: string,
    severity: ProctoringEvent["severity"] = "medium",
  ) => {
    const newEvent: ProctoringEvent = {
      id: Date.now().toString(),
      type,
      timestamp: new Date(),
      description,
      severity,
    }
    setEvents((prev) => [...prev, newEvent])

    logEventToBackend(type, description, severity)
  }

  const handleFaceDetection = useCallback(
    (result: { faceCount: number; isLookingAway: boolean; confidence: number }) => {
      const now = Date.now()

      setFaceDetectionStats((prev) => {
        const newStats = {
          currentFaces: result.faceCount,
          isLookingAway: result.isLookingAway,
          confidence: result.confidence,
          lastFaceTime: result.faceCount > 0 ? now : prev.lastFaceTime,
          lookAwayStartTime:
            result.isLookingAway && !prev.isLookingAway ? now : !result.isLookingAway ? null : prev.lookAwayStartTime,
        }

        // Check for no face detection (>10 seconds)
        if (result.faceCount === 0 && now - prev.lastFaceTime > 10000) {
          addEvent("no_face", "No face detected for more than 10 seconds", "high")
        }

        // Check for multiple faces
        if (result.faceCount > 1) {
          addEvent("multiple_faces", `${result.faceCount} faces detected in frame`, "high")
        }

        // Check for looking away (>5 seconds)
        if (newStats.lookAwayStartTime && now - newStats.lookAwayStartTime > 5000) {
          addEvent("focus_loss", "Candidate looked away from screen for more than 5 seconds", "medium")
          // Reset the timer to avoid repeated events
          newStats.lookAwayStartTime = now
        }

        return newStats
      })
    },
    [],
  )

  const handleObjectDetection = useCallback((result: { objects: any[]; suspiciousObjects: any[] }) => {
    const now = Date.now()

    setObjectDetectionStats((prev) => {
      const currentObjects = result.objects.map((obj) => obj.class)
      const suspiciousCount = result.suspiciousObjects.length

      // Log suspicious objects
      result.suspiciousObjects.forEach((obj) => {
        const description = `${obj.class} detected (${Math.round(obj.confidence * 100)}% confidence)`
        addEvent("suspicious_object", description, "high")
      })

      return {
        currentObjects,
        suspiciousCount,
        lastDetectionTime: now,
      }
    })
  }, [])

  const { isModelLoaded: faceModelLoaded } = useFaceDetection({
    videoElement: videoRef.current,
    isActive: isRecording,
    onFaceDetection: handleFaceDetection,
  })

  const { isModelLoaded: objectModelLoaded, isLoading: objectModelLoading } = useObjectDetection({
    videoElement: videoRef.current,
    isActive: isRecording,
    onObjectDetection: handleObjectDetection,
  })

  const createSession = async (candidateName: string) => {
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ candidateName }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.session.id
      } else {
        console.error("Failed to create session")
        return null
      }
    } catch (error) {
      console.error("Error creating session:", error)
      return null
    }
  }

  const endSession = async (sessionId: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endTime: new Date(),
          status: "completed",
        }),
      })
    } catch (error) {
      console.error("Error ending session:", error)
    }
  }

  const startRecording = async () => {
    try {
      const sessionId = await createSession(candidateName)
      if (!sessionId) {
        setCurrentStatus("Error: Failed to create session")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setIsRecording(true)
      setCurrentSessionId(sessionId)
      setInterviewStartTime(new Date())
      setCurrentStatus("Recording - AI monitoring active")

      setFaceDetectionStats({
        currentFaces: 0,
        isLookingAway: false,
        confidence: 0,
        lastFaceTime: Date.now(),
        lookAwayStartTime: null,
      })

      setObjectDetectionStats({
        currentObjects: [],
        suspiciousCount: 0,
        lastDetectionTime: Date.now(),
      })
    } catch (error) {
      console.error("Error accessing camera:", error)
      setCurrentStatus("Error: Camera access denied")
    }
  }

  const stopRecording = async () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    if (currentSessionId) {
      await endSession(currentSessionId)
    }

    setIsRecording(false)
    setCurrentStatus("Recording stopped")
    setCurrentSessionId(null)
  }

  const getEventIcon = (type: ProctoringEvent["type"]) => {
    switch (type) {
      case "focus_loss":
        return <EyeOff className="h-4 w-4" />
      case "no_face":
        return <Eye className="h-4 w-4" />
      case "multiple_faces":
        return <AlertTriangle className="h-4 w-4" />
      case "suspicious_object":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: ProctoringEvent["severity"]) => {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Video Proctoring System</h1>
          <p className="text-muted-foreground">Real-time interview monitoring and integrity assessment</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          {isRecording && (
            <>
              <Badge variant={faceModelLoaded ? "default" : "secondary"} className="text-sm px-3 py-1">
                <Brain className="h-3 w-3 mr-1" />
                {faceModelLoaded ? "FACE AI" : "LOADING"}
              </Badge>
              <Badge
                variant={objectModelLoaded ? "default" : objectModelLoading ? "secondary" : "outline"}
                className="text-sm px-3 py-1"
              >
                <Scan className="h-3 w-3 mr-1" />
                {objectModelLoaded ? "OBJECT AI" : objectModelLoading ? "LOADING" : "OFFLINE"}
              </Badge>
            </>
          )}
          <Badge variant={isRecording ? "destructive" : "secondary"} className="text-sm px-3 py-1">
            {isRecording ? "LIVE" : "OFFLINE"}
          </Badge>
        </div>
      </div>

      {/* Candidate Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interview Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground">Candidate Name</label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter candidate name"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                disabled={isRecording}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground">Status</label>
              <p className="mt-1 px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">{currentStatus}</p>
            </div>
          </div>

          {isRecording && (
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Faces Detected</p>
                <p
                  className={`text-lg font-bold ${
                    faceDetectionStats.currentFaces === 1
                      ? "text-green-600"
                      : faceDetectionStats.currentFaces === 0
                        ? "text-red-600"
                        : "text-orange-600"
                  }`}
                >
                  {faceDetectionStats.currentFaces}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Focus Status</p>
                <p
                  className={`text-lg font-bold ${
                    faceDetectionStats.isLookingAway ? "text-orange-600" : "text-green-600"
                  }`}
                >
                  {faceDetectionStats.isLookingAway ? "Away" : "Focused"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Detection Confidence</p>
                <p className="text-lg font-bold text-blue-600">{Math.round(faceDetectionStats.confidence * 100)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Objects Detected</p>
                <p
                  className={`text-lg font-bold ${
                    objectDetectionStats.suspiciousCount > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {objectDetectionStats.currentObjects.length}
                  {objectDetectionStats.suspiciousCount > 0 && (
                    <span className="text-xs block text-red-600">
                      {objectDetectionStats.suspiciousCount} suspicious
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {isRecording && currentSessionId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Session ID:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs">{currentSessionId}</code>
            </div>
          )}

          {interviewStartTime && (
            <p className="text-sm text-muted-foreground">Started: {interviewStartTime.toLocaleString()}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Live Video Feed
                {isRecording && (
                  <div className="ml-auto flex gap-2">
                    {faceModelLoaded && (
                      <Badge variant="outline" className="text-xs">
                        Face Detection: ON
                      </Badge>
                    )}
                    {objectModelLoaded && (
                      <Badge variant="outline" className="text-xs">
                        Object Detection: ON
                      </Badge>
                    )}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                {!isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Camera not active</p>
                    </div>
                  </div>
                )}

                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    REC
                  </div>
                )}

                {isRecording && (
                  <div className="absolute top-4 right-4 space-y-2">
                    {faceDetectionStats.currentFaces === 0 && (
                      <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">No Face Detected</div>
                    )}
                    {faceDetectionStats.currentFaces > 1 && (
                      <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs">
                        Multiple Faces: {faceDetectionStats.currentFaces}
                      </div>
                    )}
                    {faceDetectionStats.isLookingAway && faceDetectionStats.currentFaces === 1 && (
                      <div className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">Looking Away</div>
                    )}
                    {objectDetectionStats.suspiciousCount > 0 && (
                      <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                        Suspicious Objects: {objectDetectionStats.suspiciousCount}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                {!isRecording ? (
                  <Button onClick={startRecording} disabled={!candidateName.trim()} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Start Proctoring
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                    <CameraOff className="h-4 w-4" />
                    Stop Recording
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Proctoring Events
                <Badge variant="secondary" className="ml-auto">
                  {events.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No events detected</p>
                ) : (
                  events.map((event) => (
                    <Alert key={event.id} className={`border ${getSeverityColor(event.severity)}`}>
                      <div className="flex items-start gap-2">
                        {getEventIcon(event.type)}
                        <div className="flex-1 min-w-0">
                          <AlertDescription className="text-xs">
                            <div className="font-medium">{event.description}</div>
                            <div className="text-muted-foreground mt-1">{event.timestamp.toLocaleTimeString()}</div>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
