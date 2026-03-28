'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import Link from 'next/link';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  QuadraticBezierCurve3,
  Vector3,
  TubeGeometry,
  ShaderMaterial,
  Mesh,
  AdditiveBlending,
  DoubleSide,
  Color,
  PlaneGeometry,
} from 'three';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={`inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export function WaitlistExperience(): ReactElement {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 225,
    hours: 23,
    minutes: 17,
    seconds: 58,
  });

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlScrollBehavior = document.documentElement.style.scrollBehavior;

    document.body.style.overflow = 'auto';
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.scrollBehavior = previousHtmlScrollBehavior;
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new Scene();
    sceneRef.current = scene;

    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    rendererRef.current = renderer;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf8fafc, 0);
    mountRef.current.appendChild(renderer.domElement);

    const curves = [
      new QuadraticBezierCurve3(new Vector3(-15, -3, 0), new Vector3(0, 1, 0), new Vector3(12, -2, 0)),
      new QuadraticBezierCurve3(new Vector3(-14, -2, 0), new Vector3(1, 2, 0), new Vector3(10, -1, 0)),
      new QuadraticBezierCurve3(new Vector3(-16, -4, 0), new Vector3(-1, 0.5, 0), new Vector3(11, -3, 0)),
    ];

    const colors = [new Color(0x88c1ff), new Color(0xa0d2ff), new Color(0x78b6ff)];

    curves.forEach((curve, index) => {
      const tubeGeometry = new TubeGeometry(curve, 200, index === 0 ? 0.8 : 0.6, 32, false);

      const vertexShader = `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        uniform float time;
        uniform vec3 color;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vec3 baseColor = color;
          float pulse = sin(time * 1.5) * 0.1 + 0.9;
          float gradient = smoothstep(0.0, 1.0, vUv.x);
          float glow = 1.0 - abs(vUv.y - 0.5) * 2.0;
          glow = pow(glow, 2.0);
          float fade = 1.0;
          if (vUv.x > 0.7) {
            fade = 1.0 - smoothstep(0.7, 1.0, vUv.x);
          } else if (vUv.x < 0.2) {
            fade = smoothstep(0.0, 0.2, vUv.x);
          }
          vec3 finalColor = baseColor * gradient * pulse * glow * fade * 0.8;
          gl_FragColor = vec4(finalColor, glow * fade * 0.6);
        }
      `;

      const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          time: { value: 0 },
          color: { value: colors[index] },
        },
        transparent: true,
        blending: AdditiveBlending,
        side: DoubleSide,
      });

      const lightStreak = new Mesh(tubeGeometry, material);
      lightStreak.rotation.z = index * 0.15;
      scene.add(lightStreak);
    });

    const backgroundGeometry = new PlaneGeometry(80, 55);
    const backgroundMaterial = new ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        
        void main() {
          vec3 blue1 = vec3(0.7, 0.85, 1.0);
          vec3 blue2 = vec3(0.6, 0.8, 1.0);
          vec3 blue3 = vec3(0.5, 0.75, 0.95);
          float timeFactor = sin(time * 0.2) * 0.05;
          vec3 color = mix(blue1, blue2, vUv.x + timeFactor);
          color = mix(color, blue3, vUv.x * 0.3 + timeFactor);
          float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453) * 0.05;
          float blur = smoothstep(0.0, 0.2, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x));
          gl_FragColor = vec4(color + noise, 0.15 * blur);
        }
      `,
      uniforms: {
        time: { value: 0 },
      },
      transparent: true,
      side: DoubleSide,
    });

    const background = new Mesh(backgroundGeometry, backgroundMaterial);
    background.position.z = -5;
    background.position.x = -2;
    scene.add(background);

    camera.position.z = 7;
    camera.position.y = -0.8;
    camera.position.x = -1;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      scene.traverse((object) => {
        if (object instanceof Mesh && object.material instanceof ShaderMaterial) {
          if (object.material.uniforms.time) {
            object.material.uniforms.time.value = time;
          }
        }
      });

      scene.children.forEach((child, index) => {
        if (child instanceof Mesh && index < curves.length) {
          child.rotation.z = Math.sin(time * 0.1 + index * 0.5) * 0.05;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      renderer.dispose();

      scene.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          if (object.material instanceof ShaderMaterial) {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      console.log('Email submitted:', email);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main id="introduction" className="relative min-h-screen w-full overflow-hidden bg-slate-50">
      <div ref={mountRef} className="fixed inset-0 h-screen w-full" style={{ zIndex: 0 }} />

      <div className="relative z-10 min-h-screen">
        <div className="absolute left-1/2 top-8 z-20 -translate-x-1/2 transform">
          <div className="rounded-full border border-slate-200/60 bg-white/80 px-6 py-3 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-6">
              <span className="font-medium text-slate-800">Ocean Fishing</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection('introduction')}
                  className="cursor-pointer rounded-full px-3 py-1 text-sm text-slate-600 transition-colors hover:text-slate-800"
                >
                  Introduction
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  className="cursor-pointer rounded-full px-3 py-1 text-sm text-slate-600 transition-colors hover:text-slate-800"
                >
                  Features
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('pricing')}
                  className="cursor-pointer rounded-full px-3 py-1 text-sm text-slate-600 transition-colors hover:text-slate-800"
                >
                  Pricing
                </button>
                <Link
                  href="/login"
                  className="rounded-full border border-slate-300 bg-slate-800 px-3 py-1 text-sm text-white transition-colors hover:bg-slate-700"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>

        <section id="introduction" className="flex min-h-screen items-center justify-center px-4 scroll-mt-28">
          <div className="relative">
            <div className="relative w-[420px] rounded-3xl border border-slate-200/60 bg-white/30 p-8 shadow-2xl backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-50/80 to-transparent" />

              <div className="relative z-10">
                {!isSubmitted ? (
                  <>
                    <div className="mb-8 text-center">
                      <h1 className="mb-4 text-4xl font-light tracking-wide text-slate-800">Join Ocean Fishing Early Access</h1>
                      <p className="text-base leading-relaxed text-slate-600">
                        Get priority access to Ocean Fishing - the intelligent
                        <br />
                        fishery dashboard built for modern captains and crews
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mb-6">
                      <div className="flex gap-3">
                        <Input
                          type="email"
                          placeholder="captain@oceanfishing.app"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 flex-1 rounded-xl border-slate-300 bg-white/60 text-slate-800 placeholder:text-slate-500 backdrop-blur-sm focus:border-slate-400 focus:ring-slate-300"
                        />
                        <Button
                          type="submit"
                          className="h-12 cursor-pointer rounded-xl bg-slate-500 px-6 font-medium text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:bg-slate-700 hover:shadow-2xl"
                        >
                          Request Access
                        </Button>
                      </div>
                    </form>

                    <div className="mb-6 flex items-center justify-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-700 text-xs font-medium text-white">
                          C
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-700 text-xs font-medium text-white">
                          F
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-700 text-xs font-medium text-white">
                          T
                        </div>
                      </div>
                      <span className="text-sm text-slate-600">~ 120+ fishers already joined</span>
                    </div>

                    <p className="mb-4 text-center text-xs uppercase tracking-[0.16em] text-slate-500">Beta launch countdown</p>

                    <div className="flex items-center justify-center gap-6 text-center">
                      <div>
                        <div className="text-2xl font-light text-slate-800">{timeLeft.days}</div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">days</div>
                      </div>
                      <div className="text-slate-400">|</div>
                      <div>
                        <div className="text-2xl font-light text-slate-800">{timeLeft.hours}</div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">hours</div>
                      </div>
                      <div className="text-slate-400">|</div>
                      <div>
                        <div className="text-2xl font-light text-slate-800">{timeLeft.minutes}</div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">minutes</div>
                      </div>
                      <div className="text-slate-400">|</div>
                      <div>
                        <div className="text-2xl font-light text-slate-800">{timeLeft.seconds}</div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">seconds</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300 bg-gradient-to-r from-emerald-100 to-emerald-200">
                      <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-slate-800">You're on the crew list!</h3>
                    <p className="text-sm text-slate-600">We'll notify you before beta charts and zone forecasts go live.</p>
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/10 to-white/20" />
            </div>

            <div className="absolute inset-0 -z-10 scale-110 rounded-3xl bg-gradient-to-r from-blue-200/20 to-purple-200/20 blur-xl" />
          </div>
        </section>

        <section id="features" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-slate-800">Features</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">Live ocean and weather overlays</div>
              <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">Predicted fishing zone intelligence</div>
              <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">Marine alerts for safer operations</div>
              <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">LINE connect for team notifications</div>
              <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">Daily dashboard for quick decisions</div>
              <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">Optimized for vessel and mobile workflows</div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-20">
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-slate-800">Pricing</h2>
            <p className="mt-3 text-sm text-slate-600">
              Early access is currently free during beta. Paid plans will be announced after launch with options for
              individual fishers and fleet operations.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('introduction')}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
              >
                Join Waitlist
              </button>
              <Link
                href="/login"
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-700"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
