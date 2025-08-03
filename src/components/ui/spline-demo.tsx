'use client'

import { SplineScene } from "./spline";
import { Card } from "./card"
import { Spotlight } from "./spotlight"
 
export function SplineSceneBasic() {
  return (
    <Card className="w-full h-[500px] bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden border-2 border-blue-200">
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
          <p className="mt-4 text-blue-700 max-w-lg">
            Experience the future of debate training with AI-powered coaching. 
            Interactive 3D visualizations bring your arguments to life.
          </p>
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