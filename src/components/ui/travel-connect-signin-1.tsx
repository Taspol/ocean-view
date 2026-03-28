import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Eye, EyeOff, Link as LinkIcon, UserPlus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

type Mode = 'login' | 'signup';

type RoutePoint = {
  x: number;
  y: number;
  delay: number;
};

interface TravelConnectSignInProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  birthdate: string;
  setBirthdate: (value: string) => void;
  loading: boolean;
  lineConnected: boolean;
  lineConnecting: boolean;
  onConnectLine: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  error?: string;
  successMessage?: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = ({ className = '', ...props }: InputProps) => {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800',
        'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
};

const DotMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const routes: { start: RoutePoint; end: RoutePoint; color: string }[] = [
    { start: { x: 100, y: 150, delay: 0 }, end: { x: 200, y: 80, delay: 2 }, color: '#2563eb' },
    { start: { x: 200, y: 80, delay: 2 }, end: { x: 260, y: 120, delay: 4 }, color: '#2563eb' },
    { start: { x: 50, y: 50, delay: 1 }, end: { x: 150, y: 180, delay: 3 }, color: '#2563eb' },
    { start: { x: 280, y: 60, delay: 0.5 }, end: { x: 180, y: 180, delay: 2.5 }, color: '#2563eb' },
  ];

  const generateDots = (width: number, height: number) => {
    const dots: Array<{ x: number; y: number; radius: number; opacity: number }> = [];
    const gap = 12;
    const dotRadius = 1;

    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        const isInMapShape =
          ((x < width * 0.25 && x > width * 0.05) && (y < height * 0.4 && y > height * 0.1)) ||
          ((x < width * 0.25 && x > width * 0.15) && (y < height * 0.8 && y > height * 0.4)) ||
          ((x < width * 0.45 && x > width * 0.3) && (y < height * 0.35 && y > height * 0.15)) ||
          ((x < width * 0.5 && x > width * 0.35) && (y < height * 0.65 && y > height * 0.35)) ||
          ((x < width * 0.7 && x > width * 0.45) && (y < height * 0.5 && y > height * 0.1)) ||
          ((x < width * 0.8 && x > width * 0.65) && (y < height * 0.8 && y > height * 0.6));

        if (isInMapShape && Math.random() > 0.3) {
          dots.push({ x, y, radius: dotRadius, opacity: Math.random() * 0.5 + 0.2 });
        }
      }
    }
    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });

    resizeObserver.observe(canvas.parentElement);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    const ctx = context;

    const dots = generateDots(dimensions.width, dimensions.height);
    let animationFrameId = 0;
    let startTime = Date.now();

    function drawDots() {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(37, 99, 235, ${dot.opacity})`;
        ctx.fill();
      });
    }

    function drawRoutes() {
      const currentTime = (Date.now() - startTime) / 1000;

      routes.forEach((route) => {
        const elapsed = currentTime - route.start.delay;
        if (elapsed <= 0) return;

        const duration = 3;
        const progress = Math.min(elapsed / duration, 1);

        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;

        ctx.beginPath();
        ctx.moveTo(route.start.x, route.start.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = route.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = route.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.fill();

        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = route.color;
          ctx.fill();
        }
      });
    }

    function animate() {
      drawDots();
      drawRoutes();

      const currentTime = (Date.now() - startTime) / 1000;
      if (currentTime > 15) {
        startTime = Date.now();
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
};

export default function TravelConnectSignIn1({
  mode,
  setMode,
  email,
  setEmail,
  password,
  setPassword,
  birthdate,
  setBirthdate,
  loading,
  lineConnected,
  lineConnecting,
  onConnectLine,
  onSubmit,
  error,
  successMessage,
}: TravelConnectSignInProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="min-h-screen w-full bg-white p-4 md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex w-full overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <div className="relative hidden h-[640px] w-1/2 overflow-hidden border-r border-slate-100 md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100">
              <DotMap />
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mb-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200">
                    <ArrowRight className="h-6 w-6 text-white" />
                  </div>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="mb-2"
                >
                  <Image src="/logo.png" alt="OceanView logo" width={220} height={66} className="mx-auto h-auto w-auto max-w-[220px]" priority />
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="max-w-xs text-center text-sm text-slate-600"
                >
                  Access your ocean monitoring dashboard to review weather alerts, wave patterns, and fishing zones.
                </motion.p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col justify-center bg-white p-8 md:w-1/2 md:p-10">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <h1 className="mb-1 text-2xl font-bold text-slate-800 md:text-3xl">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="mb-7 text-slate-500">
                {mode === 'login' ? 'Sign in to your account' : 'Sign up to start monitoring your zones'}
              </p>

              <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={cn(
                    'h-10 rounded-md text-sm font-semibold transition-colors',
                    mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800',
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={cn(
                    'h-10 rounded-md text-sm font-semibold transition-colors',
                    mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800',
                  )}
                >
                  Sign Up
                </button>
              </div>

              <form className="space-y-5" onSubmit={onSubmit}>
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                    Email <span className="text-blue-500">*</span>
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    spellCheck={false}
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                    Password <span className="text-blue-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={isPasswordVisible ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      disabled={loading}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700"
                      onClick={() => setIsPasswordVisible((v) => !v)}
                      aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                    >
                      {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5 overflow-hidden"
                    >
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">LINE Account (optional)</label>
                        {lineConnected ? (
                          <div className="flex min-h-[44px] items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700">
                            <LinkIcon size={16} /> Connected to LINE
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={onConnectLine}
                            disabled={loading || lineConnecting}
                            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <LinkIcon size={16} />
                            {lineConnecting ? 'Connecting...' : 'Connect LINE'}
                          </button>
                        )}
                        {lineConnecting && (
                          <p className="mt-2 text-xs font-medium text-blue-700">Opening LINE login and waiting for confirmation...</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="birthdate" className="mb-1 block text-sm font-medium text-slate-700">
                          Birthdate (optional)
                        </label>
                        <Input
                          id="birthdate"
                          name="birthdate"
                          type="date"
                          value={birthdate}
                          onChange={(e) => setBirthdate(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" aria-live="polite">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" aria-live="polite">
                    {successMessage}
                  </div>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={loading}
                  className="relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 text-sm font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                  {!loading && (mode === 'login' ? <ArrowRight size={16} /> : <UserPlus size={16} />)}
                </motion.button>

                {mode === 'login' && (
                  <div className="text-center">
                    <button type="button" className="text-sm text-blue-600 transition-colors hover:text-blue-700">
                      Forgot password?
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
