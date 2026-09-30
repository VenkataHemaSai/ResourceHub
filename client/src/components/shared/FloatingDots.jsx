import { useMemo } from 'react';

const DOTS = [
  { size: 4, x: 8,  y: 15, delay: 0,   duration: 7  },
  { size: 3, x: 18, y: 65, delay: 1.5, duration: 9  },
  { size: 5, x: 25, y: 35, delay: 3,   duration: 11 },
  { size: 3, x: 35, y: 80, delay: 0.8, duration: 8  },
  { size: 4, x: 42, y: 20, delay: 2.2, duration: 10 },
  { size: 6, x: 55, y: 55, delay: 1,   duration: 13 },
  { size: 3, x: 60, y: 10, delay: 4,   duration: 7.5},
  { size: 4, x: 68, y: 70, delay: 2.8, duration: 9.5},
  { size: 5, x: 72, y: 40, delay: 0.5, duration: 12 },
  { size: 3, x: 80, y: 25, delay: 3.5, duration: 8.5},
  { size: 4, x: 85, y: 75, delay: 1.8, duration: 10.5},
  { size: 3, x: 90, y: 50, delay: 0.3, duration: 9  },
  { size: 5, x: 94, y: 15, delay: 2.5, duration: 11.5},
  { size: 3, x: 12, y: 88, delay: 4.5, duration: 8  },
  { size: 4, x: 48, y: 90, delay: 1.2, duration: 10 },
  { size: 3, x: 76, y: 92, delay: 3.8, duration: 7  },
  { size: 4, x: 3,  y: 45, delay: 2.1, duration: 9  },
  { size: 3, x: 14, y: 30, delay: 0.7, duration: 8  },
  { size: 5, x: 22, y: 72, delay: 3.3, duration: 11 },
  { size: 3, x: 30, y: 5,  delay: 1.9, duration: 7  },
  { size: 4, x: 38, y: 55, delay: 4.2, duration: 9.5},
  { size: 3, x: 45, y: 42, delay: 0.6, duration: 8.5},
  { size: 6, x: 52, y: 78, delay: 2.7, duration: 12 },
  { size: 3, x: 58, y: 28, delay: 1.4, duration: 7.5},
  { size: 4, x: 65, y: 85, delay: 3.6, duration: 10 },
  { size: 3, x: 74, y: 12, delay: 0.9, duration: 9  },
  { size: 5, x: 82, y: 60, delay: 2.4, duration: 11 },
  { size: 3, x: 88, y: 32, delay: 4.8, duration: 8  },
  { size: 4, x: 96, y: 82, delay: 1.1, duration: 10 },
  { size: 3, x: 5,  y: 72, delay: 3.2, duration: 7  },
  { size: 4, x: 32, y: 95, delay: 0.4, duration: 9  },
  { size: 3, x: 50, y: 8,  delay: 2.9, duration: 8.5},
  { size: 5, x: 63, y: 48, delay: 1.7, duration: 12 },
  { size: 3, x: 78, y: 95, delay: 4.1, duration: 7.5},
  { size: 4, x: 92, y: 38, delay: 3.0, duration: 10 },
  { size: 3, x: 16, y: 50, delay: 1.3, duration: 9  },
  { size: 4, x: 7,  y: 58, delay: 2.6, duration: 10 },
  { size: 3, x: 20, y: 22, delay: 0.2, duration: 8  },
  { size: 5, x: 28, y: 47, delay: 3.7, duration: 11 },
  { size: 3, x: 40, y: 68, delay: 1.0, duration: 7.5},
  { size: 4, x: 47, y: 14, delay: 4.3, duration: 9  },
  { size: 3, x: 57, y: 93, delay: 2.0, duration: 8.5},
  { size: 6, x: 62, y: 33, delay: 0.8, duration: 13 },
  { size: 3, x: 70, y: 58, delay: 3.4, duration: 7  },
  { size: 4, x: 77, y: 78, delay: 1.6, duration: 10 },
  { size: 3, x: 84, y: 45, delay: 4.7, duration: 8  },
  { size: 5, x: 91, y: 67, delay: 0.5, duration: 11 },
  { size: 3, x: 97, y: 28, delay: 2.3, duration: 9  },
  { size: 4, x: 11, y: 5,  delay: 3.9, duration: 10 },
  { size: 3, x: 44, y: 3,  delay: 1.8, duration: 7  },
];

export function FloatingDots() {
  return (
    <>
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0px) scale(1);   opacity: 0.4; }
          50%  { transform: translateY(-18px) scale(1.15); opacity: 0.9; }
          100% { transform: translateY(0px) scale(1);   opacity: 0.4; }
        }
        .dot-float {
          animation: float-up linear infinite;
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {DOTS.map((dot, i) => (
          <div
            key={i}
            className="dot-float absolute rounded-full"
            style={{
              width: dot.size,
              height: dot.size,
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              animationDelay: `${dot.delay}s`,
              animationDuration: `${dot.duration}s`,
              background: `radial-gradient(circle, rgba(234,88,12,0.9) 0%, rgba(234,88,12,0.3) 70%)`,
              boxShadow: `0 0 ${dot.size * 3}px ${dot.size}px rgba(234,88,12,0.35)`,
            }}
          />
        ))}
      </div>
    </>
  );
}
