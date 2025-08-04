'use client';

import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useAspect } from '@react-three/drei';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Mesh } from 'three';

// Fallback to basic Three.js if WebGPU is not available
const createRenderer = (canvas: any) => {
  try {
    // Try WebGPU first
    if ((THREE as any).WebGPURenderer) {
      const renderer = new (THREE as any).WebGPURenderer({ canvas });
      renderer.init().catch(() => {
        console.warn('WebGPU not available, falling back to WebGL');
      });
      return renderer;
    }
  } catch (error) {
    console.warn('WebGPU not available, falling back to WebGL');
  }
  
  // Fallback to WebGL
  return new THREE.WebGLRenderer({ canvas });
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

  useFrame(({ clock }: { clock: THREE.Clock }) => {
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
    <div className="h-screen relative overflow-hidden bg-white">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#3B82F6" />
        </mesh>
      </Canvas>
      
      <div className="relative z-10 flex items-center justify-center h-full text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 bg-clip-text text-transparent">
            ReasynAI
          </h1>
          <p className="text-2xl md:text-3xl font-semibold mb-8 text-blue-700">
            Your Personal AI Coach
          </p>
          <p className="text-lg md:text-xl text-blue-600 mb-12 max-w-2xl mx-auto">
            Your personal AI coach that fits in your pocket—anytime, anywhere.
          </p>
          <p className="text-base md:text-lg text-blue-600 mb-12 max-w-3xl mx-auto">
            Never miss out on judge feedback, practice any speech, and get personalized insights to improve your debating skills.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroFuturistic;