import { Trophy, Sparkles } from "lucide-react"

interface GameHeaderProps {
  score: number
  round: number
  totalRounds: number
}

export default function GameHeader({ score, round, totalRounds }: GameHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center">
      <div className="flex items-center">
        <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full text-white">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold ml-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
          Quick Sketch
        </h1>
      </div>

      {round > 0 && (
        <div className="flex items-center mt-4 md:mt-0">
          <div className="flex items-center bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-full">
            <Trophy className="h-5 w-5 text-amber-500 mr-2" />
            <span className="font-bold text-amber-800 dark:text-amber-300">{score}</span>
            <span className="text-amber-600 dark:text-amber-400 ml-1">points</span>
          </div>

          <div className="ml-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
            <span className="font-medium">
              Round {round}/{totalRounds}
            </span>
          </div>
        </div>
      )}
    </header>
  )
}

