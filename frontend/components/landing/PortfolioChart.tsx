"use client"

import { motion } from "framer-motion"

const data = [10, 25, 18, 40, 60, 80, 120]

export default function PortfolioChart() {

  return (
    <div className="mt-8 w-full max-w-md mx-auto">

      <div className="flex items-end gap-2 h-28">

        {data.map((value, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: value }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
            className="bg-gradient-to-t from-purple-500 to-indigo-400 w-6 rounded-md"
          />
        ))}

      </div>

      <p className="text-sm text-muted-foreground mt-2">
        AI portfolio growth simulation
      </p>

    </div>
  )
}