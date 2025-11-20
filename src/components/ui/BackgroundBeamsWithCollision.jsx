import { useEffect, useRef } from 'react';

export default function BackgroundBeamsWithCollision({ children, className = '' }) {
  const canvasRef = useRef(null);

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

    // Beam particles
    const beams = [];
    
    class Beam {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -50;
        this.speed = Math.random() * 2 + 1;
        this.length = Math.random() * 100 + 50;
        this.opacity = Math.random() * 0.5 + 0.3;
        
        // Purple-green gradient colors
        const colors = [
          'rgba(168, 85, 247, 0.6)',  // purple
          'rgba(139, 92, 246, 0.6)',  // lighter purple
          'rgba(34, 197, 94, 0.6)',   // green
          'rgba(16, 185, 129, 0.6)',  // emerald
          'rgba(255, 255, 255, 0.4)', // white
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y += this.speed;

        if (this.y > canvas.height + 50) {
          this.reset();
        }
      }

      draw() {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.length);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'transparent');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
      }
    }

    // Initialize beams
    for (let i = 0; i < 30; i++) {
      beams.push(new Beam());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      beams.forEach(beam => {
        beam.update();
        beam.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-green-50 ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.6 }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

