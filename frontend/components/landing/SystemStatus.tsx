"use client"

import { useEffect, useState } from "react"

const messages = [

"Analyzing financial patterns...",
"Building AI investment insights...",
"Preparing wealth dashboard...",
"Optimizing portfolio intelligence..."

]

export default function SystemStatus(){

const [index,setIndex] = useState(0)

useEffect(()=>{

const interval = setInterval(()=>{

setIndex((prev)=>(prev+1)%messages.length)

},2500)

return ()=>clearInterval(interval)

},[])

return(

<p className="text-sm text-gray-500 mt-4">
{messages[index]}
</p>

)

}
