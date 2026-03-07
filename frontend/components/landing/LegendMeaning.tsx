"use client"

import { useEffect, useState } from "react"

const words = [
  "Learning",
  "Engine",
  "for",
  "Guided",
  "Economic",
  "Navigation",
  "&",
  "Decisions"
]

export default function LegendMeaning(){

  const [visible,setVisible] = useState(0)

  useEffect(()=>{

    const interval = setInterval(()=>{
      setVisible((prev)=>{
        if(prev >= words.length) return prev
        return prev + 1
      })
    },300)

    return ()=>clearInterval(interval)

  },[])

  return(

    <div className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">

      <div className="text-sm md:text-base leading-relaxed">

        {words.slice(0,visible).map((word,i)=>{

          const first = word.charAt(0)
          const rest = word.slice(1)

          const highlight =
            first === "L" ||
            first === "E" ||
            first === "G" ||
            first === "E" ||
            first === "N" ||
            first === "D"

          return(

            <span key={i} className="mr-2">

              <span className="text-primary font-bold text-lg">
                {first}
              </span>

              {rest}

            </span>

          )

        })}

      </div>

    </div>

  )
}