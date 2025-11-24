import React, { useEffect, useState } from "react";

export default function Starfield() {
  const STAR_COUNT = 120;
  const [stars] = useState(() =>
    [...Array(STAR_COUNT)].map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
    }))
  );

  const [streak, setStreak] = useState(null);

  useEffect(() => {
    const spawnStreak = () => {
      const height = Math.random() * 100;
      const leftToRight = Math.random() < 0.5;

      setStreak({
        id: Date.now(),
        height,
        leftToRight,
      });

      setTimeout(() => setStreak(null), 3000);
    };

    spawnStreak();
    const interval = setInterval(spawnStreak, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {/* ⭐ Blue stars */}
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            ...styles.star,
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* 💛 Horizontal streak */}
      {streak && (
        <div
          key={streak.id}
          style={{
            ...styles.streak,
            top: `${streak.height}%`,
            animationName: streak.leftToRight ? "slideRight" : "slideLeft",
          }}
        />
      )}

      <style>
        {`
          @keyframes twinkle {
            0% { opacity: 0.3; }
            50% { opacity: 0.9; }
            100% { opacity: 0.3; }
          }

          @keyframes slideRight {
            0% { transform: translateX(-100vw); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateX(100vw); opacity: 0; }
          }

          @keyframes slideLeft {
            0% { transform: translateX(100vw); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateX(-100vw); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    background: "white",
    overflow: "hidden",
  },
  star: {
    position: "absolute",
    background: "rgba(120,165,255,0.7)",
    borderRadius: "50%",
    animation: "twinkle 2s infinite ease-in-out",
    boxShadow: "0 0 6px 2px rgba(120,165,255,0.7)",
  },
  streak: {
    position: "absolute",
    height: "3px",
    width: "100vw",
    background: "rgba(255,215,50,1)",
    filter: "blur(3px)",
    boxShadow: "0 0 25px 8px rgba(255,215,50,0.8)",
    animationDuration: "3s",
    animationTimingFunction: "ease-in-out",
    pointerEvents: "none",
  },
};
