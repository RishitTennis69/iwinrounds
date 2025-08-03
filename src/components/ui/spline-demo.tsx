'use client'

import { SplineScene } from "./spline";
import { Card } from "./card"
import { Spotlight } from "./spotlight"
 
export function SplineSceneBasic() {
  return (
    <Card className="w-full h-[600px] bg-gradient-to-br from-blue-50/10 to-indigo-100/10 relative overflow-hidden border-2 border-blue-200/30 backdrop-blur-sm">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        size={300}
      />
      
      <div className="flex h-full">
        {/* Left content */}
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-blue-600 to-indigo-800">
            ReasynAI Coach
          </h1>
          <p className="mt-4 text-white/90 max-w-lg text-lg">
            Your personal AI debate coach that fits in your pocket.
          </p>
          <p className="mt-2 text-white/70 max-w-lg">
            Never miss out on judge feedback, practice any speech, and get personalized insights to improve your debating skills.
          </p>
          <button
            onClick={() => {
              const contentSection = document.getElementById('main-content');
              if (contentSection) {
                contentSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-lg font-semibold rounded-full shadow-lg hover:from-blue-700 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 w-fit"
          >
            Get Started
          </button>
        </div>

        {/* Right content */}
        <div className="flex-1 relative">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}