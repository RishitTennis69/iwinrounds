'use client'

import { SplineScene } from "./spline";
import { Card } from "./card"
import { Spotlight } from "./spotlight"

interface HeroSectionProps {
  setShowModal: (show: boolean) => void;
  features: Array<{
    icon: React.ReactNode;
    title: string;
    desc: string;
  }>;
}
 
export function HeroSection({ setShowModal, features }: HeroSectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800">
      {/* Hero Section with 3D Spline */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center text-white px-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] transition-all duration-500">
            ReasynAI
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] hover:drop-shadow-[0_8px_16px_rgba(59,130,246,0.6)] transition-all duration-300 animate-bounce-once">
            Master the art of debating with the power of AI
          </h2>
        </div>
        {/* Full width 3D Scene */}
        <div className="w-full relative">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
      
      {/* Features Section */}
      <div id="main-content" className="py-16 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Powerful Features
          </h3>
          <p className="text-white/70 text-center mb-12 text-lg max-w-2xl mx-auto">
            Everything you need to become a better debater, powered by advanced AI technology
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-500/20 border border-white/20">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-200 transition-colors">{f.title}</h3>
                  <p className="text-white/70 leading-relaxed">{f.desc}</p>
                </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button
              onClick={() => setShowModal(true)}
              className="px-12 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl font-semibold rounded-full shadow-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300/50 backdrop-blur-sm border border-white/20"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}