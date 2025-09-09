import { SessionReport } from "@/components/session-report"

interface ReportPageProps {
  params: {
    sessionId: string
  }
}

export default function ReportPage({ params }: ReportPageProps) {
  return (
    <main className="min-h-screen bg-background">
      <SessionReport sessionId={params.sessionId} />
    </main>
  )
}
