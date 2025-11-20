import { useEffect, useRef } from 'react';

export default function BubbleBackground({ children, interactive = true, className = '' }) {
  const canvasRef = useRef(null);
  const bubblesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Color config - blue-green theme
    const colors = [
      'rgba(18, 113, 255, 0.15)',   // blue
      'rgba(0, 220, 200, 0.15)',    // cyan/teal
      'rgba(0, 180, 255, 0.15)',    // light blue
      'rgba(100, 200, 200, 0.15)',  // blue-green
      'rgba(50, 150, 200, 0.15)',   // medium blue
      'rgba(140, 220, 255, 0.15)',  // light cyan
    ];

    // Create bubbles
    class Bubble {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 60 + 40;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < -this.radius || this.x > canvas.width + this.radius) {
          this.vx *= -1;
        }
        if (this.y < -this.radius || this.y > canvas.height + this.radius) {
          this.vy *= -1;
        }

        // Interactive - move away from mouse
        if (interactive) {
          const dx = this.x - mouseRef.current.x;
          const dy = this.y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            const force = (150 - distance) / 150;
            this.x += (dx / distance) * force * 2;
            this.y += (dy / distance) * force * 2;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add subtle glow
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        );
        gradient.addColorStop(0, this.color.replace('0.15', '0.3'));
        gradient.addColorStop(1, this.color.replace('0.15', '0'));
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    // Initialize bubbles
    for (let i = 0; i < 15; i++) {
      bubblesRef.current.push(new Bubble());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubblesRef.current.forEach(bubble => {
        bubble.update();
        bubble.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [interactive]);

  return (
    <div className={`relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

