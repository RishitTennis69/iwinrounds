'use client';

import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { useAspect, useTexture } from '@react-three/drei';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Mesh } from 'three';

// Fallback to basic Three.js if WebGPU is not available
const createRenderer = async (props: any) => {
  try {
    // Try WebGPU first
    if ((THREE as any).WebGPURenderer) {
      const renderer = new (THREE as any).WebGPURenderer(props);
      await renderer.init();
      return renderer;
    }
  } catch (error) {
    console.warn('WebGPU not available, falling back to WebGL');
  }
  
  // Fallback to WebGL
  return new THREE.WebGLRenderer(props);
};

extend(THREE as any);

// Simplified Post Processing for WebGL compatibility
const PostProcessing = ({
  strength = 1,
  threshold = 1,
  fullScreenEffect = true,
}: {
  strength?: number;
  threshold?: number;
  fullScreenEffect?: boolean;
}) => {
  return null; // Simplified for compatibility
};

const WIDTH = 300;
const HEIGHT = 300;

const Scene = () => {
  // Use placeholder images that are more likely to work
  const TEXTUREMAP = 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=512&h=512&fit=crop';
  const DEPTHMAP = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=512&h=512&fit=crop&auto=format';

  const meshRef = useRef<Mesh>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show the mesh after a short delay
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x0066ff),
      transparent: true,
      opacity: 0.3,
    });
  }, []);

  const [w, h] = useAspect(WIDTH, HEIGHT);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Animate opacity
      if (material.opacity < 0.8 && visible) {
        material.opacity += 0.01;
      }
      
      // Subtle rotation animation
      meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  const scaleFactor = 0.40;
  return (
    <mesh ref={meshRef} scale={[w * scaleFactor, h * scaleFactor, 1]} material={material}>
      <planeGeometry />
    </mesh>
  );
};

export const HeroFuturistic = () => {
  const titleWords = 'ReasynAI Coach'.split(' ');
  const subtitle = 'Your personal AI debate coach that fits in your pocket.';
  const [visibleWords, setVisibleWords] = useState(0);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [delays, setDelays] = useState<number[]>([]);
  const [subtitleDelay, setSubtitleDelay] = useState(0);

  useEffect(() => {
    setDelays(titleWords.map(() => Math.random() * 0.07));
    setSubtitleDelay(Math.random() * 0.1);
  }, [titleWords.length]);

  useEffect(() => {
    if (visibleWords < titleWords.length) {
      const timeout = setTimeout(() => setVisibleWords(visibleWords + 1), 600);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setSubtitleVisible(true), 800);
      return () => clearTimeout(timeout);
    }
  }, [visibleWords, titleWords.length]);

  const scrollToContent = () => {
    const contentSection = document.getElementById('main-content');
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <div className="h-screen relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
      <div className="h-screen uppercase items-center w-full absolute z-50 pointer-events-none px-10 flex justify-center flex-col">
        <div className="text-3xl md:text-5xl xl:text-6xl 2xl:text-7xl font-extrabold">
          <div className="flex space-x-2 lg:space-x-6 overflow-hidden text-white">
            {titleWords.map((word, index) => (
              <div
                key={index}
                className={`transition-all duration-1000 ${index < visibleWords ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ 
                  animationDelay: `${index * 0.13 + (delays[index] || 0)}s`,
                  transitionDelay: `${index * 0.13 + (delays[index] || 0)}s`
                }}
              >
                {word}
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs md:text-xl xl:text-2xl 2xl:text-3xl mt-2 overflow-hidden text-white font-bold normal-case">
          <div
            className={`transition-all duration-1000 ${subtitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ 
              transitionDelay: `${titleWords.length * 0.13 + 0.2 + subtitleDelay}s`
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      <button
        onClick={scrollToContent}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50 text-white border border-white/30 px-6 py-3 rounded-full hover:bg-white/10 transition-all duration-300 opacity-0 animate-fade-in-delayed pointer-events-auto"
        style={{ animationDelay: '2.2s' }}
      >
        Explore Features
        <span className="ml-2 inline-block">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline">
            <path d="M11 5V17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 12L11 17L16 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
      </button>

      <Canvas
        className="absolute inset-0"
        gl={createRenderer}
      >
        <PostProcessing fullScreenEffect={true} />
        <Scene />
      </Canvas>
    </div>
  );
};

export default HeroFuturistic;