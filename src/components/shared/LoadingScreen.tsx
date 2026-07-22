import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';

interface LoadingScreenProps {
    onFinished?: () => void;
    minDurationMs?: number;
}

interface Particle {
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

function useIsLight(): boolean {
    const { state } = useApp();
    const mode = state.settings.theme_mode || 'system';
    if (mode === 'light') return true;
    if (mode === 'dark') return false;
    return typeof window !== 'undefined' &&
        window.matchMedia &&
        !window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function LoadingScreen({ onFinished, minDurationMs = 1200 }: LoadingScreenProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [progress, setProgress] = useState(0);
    const [fadingOut, setFadingOut] = useState(false);
    const isLight = useIsLight();

    const iconSrc = '/icon-red.svg';

    const bgColor = isLight ? '#fdf2f2' : '#050505';
    const overlayFrom = isLight ? 'rgba(253,242,242,0)' : 'rgba(5,5,5,0)';
    const overlayVia = isLight ? 'rgba(253,242,242,0.4)' : 'rgba(5,5,5,0.4)';
    const overlayTo = isLight ? '#fdf2f2' : '#050505';

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

        const darkColors = [
            'rgba(255, 42, 42, ',
            'rgba(251, 146, 60, ',
            'rgba(244, 63, 94, ',
            'rgba(255, 215, 0, ',
            'rgba(255, 255, 255, ',
        ];
        const lightColors = [
            'rgba(255, 42, 42, ',
            'rgba(251, 100, 60, ',
            'rgba(200, 50, 50, ',
            'rgba(220, 160, 50, ',
            'rgba(80, 80, 80, ',
        ];
        const particleColors = isLight ? lightColors : darkColors;

        const particleCount = 55;
        const particles: Particle[] = [];

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
                pulseOffset: Math.random() * Math.PI * 2,
            });
        }

        let time = 0;

        const render = () => {
            time += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particleCount; i++) {
                const p = particles[i];

                p.y += p.speedY;
                p.x += p.speedX;

                p.alpha = p.baseAlpha + Math.sin(time * p.pulseSpeed * 50 + p.pulseOffset) * 0.15;
                p.alpha = Math.max(0.05, Math.min(0.8, p.alpha));

                if (p.y < -10) {
                    p.y = canvas.height + 10;
                    p.x = Math.random() * canvas.width;
                }
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;

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
    }, [isLight]);

    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const pct = Math.min(100, Math.round((elapsed / minDurationMs) * 100));
            setProgress(pct);

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
            className={`fixed inset-0 z-[100000] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ease-out select-none ${fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            style={{ backgroundColor: bgColor }}
        >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at center, ${overlayFrom}, ${overlayVia}, ${overlayTo})`,
                }}
            />

            <div className="relative z-10 flex flex-col items-center gap-8">
                <img
                    src={iconSrc}
                    alt="Fin"
                    className="w-28 h-28 animate-logo-popup drop-shadow-lg"
                />

                <div className="w-56">
                    <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-brand via-amber-500 to-brand rounded-full"
                            style={{ width: `${progress}%`, transition: 'width 80ms linear' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
