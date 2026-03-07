"use client"

import HeroCanvas from "./HeroCanvas"
import LegendReveal from "./LegendReveal"
import LegendMeaning from "./LegendMeaning"
import SystemStatus from "./SystemStatus"
import Link from "next/link"

export default function LandingHero(){

  return(

    <section className="relative h-screen w-full overflow-hidden">

      {/* 3D background */}
      <div className="absolute inset-0">
        <HeroCanvas/>
      </div>

      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/60"/>

      {/* content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center">

        <LegendReveal/>

        <LegendMeaning/>

        <SystemStatus/>

        <div className="flex gap-4 mt-8">

          <Link
          href="/signup"
          className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700"
          >
          Get Started
          </Link>

          <Link
          href="/login"
          className="px-6 py-3 border border-gray-400 rounded-lg"
          >
          Login
          </Link>

        </div>

      </div>

    </section>
  )
}