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
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-gradient-to-br from-blue-900/95 via-indigo-900/95 to-blue-800/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-white font-semibold text-xl">ReasynAI</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#features" 
              className="text-blue-200 hover:text-white transition-all duration-300 hover:scale-105"
              onClick={(e) => {
                e.preventDefault();
                const featuresSection = document.getElementById('main-content');
                if (featuresSection) {
                  featuresSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              }}
            >
              Features
            </a>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with 3D Spline */}
      <div className="h-screen flex items-center justify-center relative pt-16">
        <Card className="w-full max-w-6xl mx-auto h-[600px] bg-gradient-to-br from-blue-50/10 to-indigo-100/10 relative overflow-hidden border-2 border-blue-200/30 backdrop-blur-sm">
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            size={300}
          />
          
          <div className="flex h-full">
            {/* Left content */}
            <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] transition-all duration-500">
                ReasynAI
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] hover:drop-shadow-[0_8px_16px_rgba(59,130,246,0.6)] transition-all duration-300 animate-bounce-once">
                Master the art of debating with the power of AI
              </h2>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-base font-semibold rounded-full shadow-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300/50 backdrop-blur-sm border border-white/20 mb-6"
              >
                Get Started
              </button>
            </div>
            
            {/* Right side - 3D Scene */}
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
      <div id="main-content" className="py-16 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Powerful Features
          </h3>
          <p className="text-white/70 text-center mb-12 text-lg max-w-2xl mx-auto">
            Everything you need to become a better debater, powered by advanced AI technology
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1: AI Opponents */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-500/20 border border-white/20">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-3">Debate Against AI Opponents</h4>
                  <p className="text-white/80 leading-relaxed">
                    Practice with intelligent AI opponents that adapt to your skill level.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: Beautiful Flow */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 border border-white/20">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-3">Beautifully Flowed Rounds</h4>
                  <p className="text-white/80 leading-relaxed">
                    Track your debate progress with stunning visual flow charts.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: Personalized Feedback */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 border border-white/20">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-3">Personalized Feedback</h4>
                  <p className="text-white/80 leading-relaxed">
                    Receive detailed, AI-powered feedback on your speaking style and arguments.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4: Practice Any Speech */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-orange-400/20 to-red-500/20 border border-white/20">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-3">Practice Any Speech</h4>
                  <p className="text-white/80 leading-relaxed">
                    Practice any speech of the round, rebuttal, summary, that kind of stuff.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call-to-Action Section */}
      <div id="about" className="py-16 px-4 bg-gradient-to-br from-blue-800/50 to-indigo-900/50">
        <div className="w-full max-w-4xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Master Your Debate Skills?
          </h3>
          <p className="text-white/80 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
            Start your journey to becoming a more confident and persuasive speaker today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-semibold rounded-full shadow-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300/50"
            >
              Start Your First Debate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}