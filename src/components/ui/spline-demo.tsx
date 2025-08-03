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
              
              {/* Illustration */}
              <div className="w-80 h-80 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-xl relative overflow-visible border border-blue-200 mb-8">
                <img
                  src="/image-removebg-preview.png"
                  alt="Debate illustration"
                  className="w-72 h-72 object-contain rounded-2xl"
                />
              </div>
              
              <button
                onClick={() => setShowModal(true)}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xl font-semibold rounded-full shadow-lg hover:from-blue-700 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 w-fit"
              >
                Get Started
              </button>
            </div>

            {/* Right content - 3D Scene */}
            <div className="flex-1 relative">
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
      <div id="main-content" className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md p-6 flex flex-col items-center border-t-4 border border-blue-200" style={{ borderTopColor: ['#34d399', '#3b82f6', '#a78bfa', '#f59e0b'][i] }}>
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2 text-blue-900">{f.title}</h3>
              <p className="text-blue-700 text-center">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}