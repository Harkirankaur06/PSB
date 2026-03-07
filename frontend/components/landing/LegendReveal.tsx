"use client"

import { motion } from "framer-motion"

const letters = ["L","E","G","E","N","D"]

export default function LegendReveal(){

  return (
    <div className="flex gap-2 text-6xl font-bold">

      {letters.map((l,i)=>(
        <motion.span
          key={i}
          initial={{opacity:0,y:40}}
          animate={{opacity:1,y:0}}
          transition={{delay:i*0.25}}
          className="text-purple-400"
        >
          {l}
        </motion.span>
      ))}

    </div>
  )
}