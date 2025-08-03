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
    <div className="min-h-screen">
      {/* Hero Section with 3D Spline */}
      <div className="h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center relative">
        <Card className="w-full max-w-6xl mx-auto h-[600px] bg-gradient-to-br from-blue-50/10 to-indigo-100/10 relative overflow-hidden border-2 border-blue-200/30 backdrop-blur-sm">
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            size={300}
          />
          
          <div className="flex h-full">
            {/* Left content */}
            <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
              <h1 className="text-5xl md:text-6xl font-bold text-blue-900 mb-2 drop-shadow-lg">
                ReasynAI
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-blue-700 mb-4">
                Your Personal AI Coach
              </h2>
              <p className="text-xl text-blue-800 mb-4 font-medium">
                Your personal AI coach that fits in your pocket—anytime, anywhere.
              </p>
              <p className="text-md text-blue-600 mb-8">
                Never miss out on judge feedback, practice any speech, and get personalized insights to improve your debating skills.
              </p>
            </div>
            {/* Full width 3D Scene */}
            <div className="w-full relative">
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </Card>
        
        <button
          onClick={() => {
            const contentSection = document.getElementById('main-content');
            if (contentSection) {
              contentSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50 text-white border border-white/30 px-6 py-3 rounded-full hover:bg-white/10 transition-all duration-300"
        >
          Explore Features
          <span className="ml-2 inline-block">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline">
              <path d="M11 5V17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 12L11 17L16 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
        </button>
      </div>
      
      {/* Features Section */}
      <div id="main-content" className="bg-gradient-to-br from-blue-900/20 to-indigo-900/30 py-16 px-4 backdrop-blur-sm">
        <div className="w-full max-w-6xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Powerful Features
          </h3>
          <p className="text-white/70 text-center mb-12 text-lg max-w-2xl mx-auto">
            Everything you need to become a better debater, powered by advanced AI technology
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-500/20 border border-white/20">
                  {f.icon}
                </div>
                <div className="flex-1">
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