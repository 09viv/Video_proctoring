"use client"

import { useEffect, useRef, useState } from "react"

interface FaceDetectionResult {
  faceCount: number
  isLookingAway: boolean
  confidence: number
}

interface FaceDetectionHookProps {
  videoElement: HTMLVideoElement | null
  isActive: boolean
  onFaceDetection: (result: FaceDetectionResult) => void
}

export function useFaceDetection({ videoElement, isActive, onFaceDetection }: FaceDetectionHookProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isModelLoaded, setIsModelLoaded] = useState(false)

  useEffect(() => {
    let faceDetector: any = null

    const initializeFaceDetection = async () => {
      try {
        // Check if Face Detection API is available
        if ("FaceDetector" in window) {
          // @ts-ignore - FaceDetector is experimental
          faceDetector = new window.FaceDetector({
            maxDetectedFaces: 10,
            fastMode: false,
          })
          setIsModelLoaded(true)
        } else {
          // Fallback to a simpler detection method using canvas analysis
          console.log("Using fallback face detection method")
          setIsModelLoaded(true)
        }
      } catch (error) {
        console.error("Face detection initialization failed:", error)
        // Use fallback method
        setIsModelLoaded(true)
      }
    }

    initializeFaceDetection()

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isActive || !videoElement || !isModelLoaded) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
      return
    }

    // Create canvas for face detection processing
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Set canvas size to match video
    canvas.width = videoElement.videoWidth || 640
    canvas.height = videoElement.videoHeight || 480

    const detectFaces = async () => {
      if (!videoElement || videoElement.readyState !== 4) return

      try {
        // Draw current video frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

        let faceCount = 0
        let isLookingAway = false
        let confidence = 0

        // Try using native Face Detection API first
        if ("FaceDetector" in window) {
          try {
            // @ts-ignore - FaceDetector is experimental
            const faces = await new window.FaceDetector().detect(canvas)
            faceCount = faces.length
            confidence = faces.length > 0 ? 0.8 : 0

            // Simple gaze detection based on face position
            if (faces.length === 1) {
              const face = faces[0]
              const faceCenter = {
                x: face.boundingBox.x + face.boundingBox.width / 2,
                y: face.boundingBox.y + face.boundingBox.height / 2,
              }

              // Check if face is roughly centered (simple gaze approximation)
              const centerThreshold = 0.3
              const isOffCenter =
                Math.abs(faceCenter.x - canvas.width / 2) > canvas.width * centerThreshold ||
                Math.abs(faceCenter.y - canvas.height / 2) > canvas.height * centerThreshold

              isLookingAway = isOffCenter
            }
          } catch (apiError) {
            // Fall back to simple detection
            const result = simpleFaceDetection(ctx, canvas)
            faceCount = result.faceCount
            confidence = result.confidence
            isLookingAway = result.isLookingAway
          }
        } else {
          // Fallback: Simple face detection using color analysis
          const result = simpleFaceDetection(ctx, canvas)
          faceCount = result.faceCount
          confidence = result.confidence
          isLookingAway = result.isLookingAway
        }

        onFaceDetection({
          faceCount,
          isLookingAway,
          confidence,
        })
      } catch (error) {
        console.error("Face detection error:", error)
      }
    }

    // Start detection interval
    detectionIntervalRef.current = setInterval(detectFaces, 1000) // Check every second

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [isActive, videoElement, isModelLoaded, onFaceDetection])

  return { isModelLoaded }
}

// Fallback face detection using simple image analysis
function simpleFaceDetection(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Simple skin tone detection (very basic)
  let skinPixels = 0
  const totalPixels = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Basic skin tone detection
    if (
      r > 95 &&
      g > 40 &&
      b > 20 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
      Math.abs(r - g) > 15 &&
      r > g &&
      r > b
    ) {
      skinPixels++
    }
  }

  const skinRatio = skinPixels / totalPixels

  // Estimate face presence based on skin pixel ratio
  const faceCount = skinRatio > 0.02 ? 1 : 0
  const confidence = Math.min(skinRatio * 10, 1)

  // Simple "looking away" detection based on skin distribution
  const isLookingAway = skinRatio > 0.01 && skinRatio < 0.015

  return {
    faceCount,
    confidence,
    isLookingAway,
  }
}
