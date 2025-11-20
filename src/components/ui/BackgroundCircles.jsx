import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export default function BackgroundCircles({ variant = 'primary' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const circles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Create circles with green theme
    const colors = variant === 'primary' 
      ? ['rgba(134, 239, 172, 0.15)', 'rgba(74, 222, 128, 0.15)', 'rgba(34, 197, 94, 0.15)', 'rgba(22, 163, 74, 0.15)']
      : ['rgba(96, 165, 250, 0.15)', 'rgba(59, 130, 246, 0.15)', 'rgba(37, 99, 235, 0.15)'];

    for (let i = 0; i < 8; i++) {
      circles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 150 + 50,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      circles.forEach(circle => {
        // Update position
        circle.x += circle.vx;
        circle.y += circle.vy;

        // Bounce off edges
        if (circle.x < -circle.radius || circle.x > canvas.width + circle.radius) {
          circle.vx *= -1;
        }
        if (circle.y < -circle.radius || circle.y > canvas.height + circle.radius) {
          circle.vy *= -1;
        }

        // Draw circle
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

