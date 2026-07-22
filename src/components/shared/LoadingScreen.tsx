import { useEffect, useRef, useState } from 'react';

interface LoadingScreenProps {
    onFinished?: () => void;
    minDurationMs?: number;
}

interface GodParticle {
    x: number;
    y: number;
    radius: number;
    baseAlpha: number;
    alpha: number;
    speedY: number;
    speedX: number;
    color: string;
    pulseSpeed: number;
    pulseOffset: number;
}

export default function LoadingScreen({ onFinished, minDurationMs = 2000 }: LoadingScreenProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Initializing workspace...');
    const [fadingOut, setFadingOut] = useState(false);

    // --- GOD PARTICLES & VOLUMETRIC LIGHT RAYS ENGINE ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        // Particle colors: Crimson Red, Amber Gold, Rose, Warm Light
        const particleColors = [
            'rgba(255, 42, 42, ',
            'rgba(251, 146, 60, ',
            'rgba(244, 63, 94, ',
            'rgba(255, 215, 0, ',
            'rgba(255, 255, 255, '
        ];

        // Generate God Particles
        const particleCount = 55;
        const particles: GodParticle[] = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1,
                baseAlpha: Math.random() * 0.45 + 0.15,
                alpha: Math.random() * 0.45 + 0.15,
                speedY: -(Math.random() * 0.6 + 0.2),
                speedX: (Math.random() - 0.5) * 0.3,
                color: particleColors[Math.floor(Math.random() * particleColors.length)],
                pulseSpeed: Math.random() * 0.03 + 0.01,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }

        let time = 0;

        const render = () => {
            time += 0.02;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // --- 1. VOLUMETRIC GOD RAYS FROM CENTER ---
            const rayCount = 8;
            for (let r = 0; r < rayCount; r++) {
                const angle = (r / rayCount) * Math.PI * 2 + time * 0.05;
                const rayWidth = 0.25 + Math.sin(time * 0.5 + r) * 0.05;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, Math.max(canvas.width, canvas.height), angle - rayWidth, angle + rayWidth);
                ctx.closePath();

                const rayGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, Math.max(canvas.width, canvas.height) * 0.8);
                rayGrad.addColorStop(0, 'rgba(255, 42, 42, 0.08)');
                rayGrad.addColorStop(0.5, 'rgba(255, 120, 42, 0.03)');
                rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = rayGrad;
                ctx.fill();
                ctx.restore();
            }

            // --- 2. FLOATING GOD PARTICLES ---
            for (let i = 0; i < particleCount; i++) {
                const p = particles[i];

                // Floating position update
                p.y += p.speedY;
                p.x += p.speedX;

                // Pulsing opacity
                p.alpha = p.baseAlpha + Math.sin(time * p.pulseSpeed * 50 + p.pulseOffset) * 0.15;
                p.alpha = Math.max(0.05, Math.min(0.8, p.alpha));

                // Wrap around edges smoothly
                if (p.y < -10) {
                    p.y = canvas.height + 10;
                    p.x = Math.random() * canvas.width;
                }
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;

                // Draw glowing particle
                ctx.save();
                ctx.beginPath();
                const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
                radGrad.addColorStop(0, `${p.color}${p.alpha})`);
                radGrad.addColorStop(0.5, `${p.color}${p.alpha * 0.4})`);
                radGrad.addColorStop(1, `${p.color}0)`);

                ctx.fillStyle = radGrad;
                ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // --- PROGRESS & DISMISSAL CONTROLLER ---
    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const pct = Math.min(100, Math.round((elapsed / minDurationMs) * 100));

            setProgress(pct);

            if (pct < 30) {
                setStatusText('Initializing workspace...');
            } else if (pct < 60) {
                setStatusText('Loading account ledgers...');
            } else if (pct < 90) {
                setStatusText('Calculating fund balances...');
            } else {
                setStatusText('Ready');
            }

            if (elapsed >= minDurationMs) {
                clearInterval(interval);
                setFadingOut(true);
                setTimeout(() => {
                    if (onFinished) onFinished();
                }, 500);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [minDurationMs, onFinished]);

    return (
        <div
            className={`fixed inset-0 z-[100000] bg-[#050505] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ease-out select-none ${
                fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            {/* God Particles Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {/* Ambient Radial Overlay */}
            <div className="absolute inset-0 bg-radial from-transparent via-[#050505]/40 to-[#050505] pointer-events-none" />

            {/* Central Branding & Animated Logo Pop-Up */}
            <div className="relative z-10 flex flex-col items-center space-y-6 px-6 text-center">
                {/* LOGO ICON POPUP WITH SPRING BOUNCE & BEACON GLOW */}
                <div className="relative flex items-center justify-center">
                    {/* Outer Glowing Radial Aura */}
                    <div className="absolute w-32 h-32 rounded-full bg-brand/25 blur-3xl animate-pulse" />

                    {/* Pop-up Logo Icon Box */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1A1A1E] to-[#0D0D10] border border-brand/60 shadow-[0_0_40px_rgba(255,42,42,0.45)] flex items-center justify-center text-brand transform animate-logo-popup backdrop-blur-md">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-10 h-10 text-brand drop-shadow-[0_0_12px_rgba(255,42,42,0.8)]"
                        >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                </div>

                {/* Typography */}
                <div className="space-y-1.5 animate-slide-up-scale">
                    <h1 className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-txt-primary uppercase">
                        FIN
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-txt-secondary/80">
                        Personal Finance System
                    </p>
                </div>

                {/* Progress Bar & Status */}
                <div className="w-64 space-y-2.5 pt-2 animate-slide-up-scale">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10 backdrop-blur-sm">
                        <div
                            className="h-full bg-gradient-to-r from-brand via-amber-500 to-brand rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(255,42,42,0.8)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono font-medium text-txt-secondary">
                        <span className="truncate pr-2">{statusText}</span>
                        <span className="font-bold text-brand">{progress}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
