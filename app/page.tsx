import type { Metadata } from "next"
import DrawingGame from "@/components/drawing-game"

export const metadata: Metadata = {
  title: "Quick Sketch | Draw and Let AI Guess",
  description: "Challenge the AI to recognize your drawings in this fun interactive game",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <DrawingGame />
    </main>
  )
}

