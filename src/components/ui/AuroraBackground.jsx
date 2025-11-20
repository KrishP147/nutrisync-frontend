import { useEffect, useRef } from 'react';

export default function AuroraBackground({ children, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    const animate = () => {
      time += 0.005;

      // Create gradient layers
      const gradient1 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient1.addColorStop(0, `rgba(168, 85, 247, ${0.4 + Math.sin(time) * 0.1})`); // purple
      gradient1.addColorStop(0.5, `rgba(59, 130, 246, ${0.3 + Math.cos(time * 0.8) * 0.1})`); // blue
      gradient1.addColorStop(1, `rgba(34, 197, 94, ${0.3 + Math.sin(time * 1.2) * 0.1})`); // green

      const gradient2 = ctx.createLinearGradient(canvas.width, 0, 0, canvas.height);
      gradient2.addColorStop(0, `rgba(139, 92, 246, ${0.3 + Math.cos(time * 1.5) * 0.1})`); // violet
      gradient2.addColorStop(0.5, `rgba(16, 185, 129, ${0.2 + Math.sin(time * 0.7) * 0.1})`); // emerald
      gradient2.addColorStop(1, `rgba(96, 165, 250, ${0.3 + Math.cos(time * 0.9) * 0.1})`); // light blue

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply gradients
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className={`relative min-h-screen overflow-hidden bg-white ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.5 }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

