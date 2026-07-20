import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'exit'>('logo');

  useEffect(() => {
    // Phase timing: logo appears → text slides up → exit fade
    const t1 = setTimeout(() => setPhase('text'), 600);
    const t2 = setTimeout(() => setPhase('exit'), 1800);
    const t3 = setTimeout(() => onComplete(), 2300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-background-cream flex flex-col items-center justify-center"
        >
          {/* Subtle background texture lines */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="absolute h-px bg-border"
                style={{ top: `${15 + i * 14}%`, left: 0, right: 0, transformOrigin: 'left' }}
              />
            ))}
          </div>

          {/* Logo mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Decorative ring */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 -m-6 border border-primary/15 rounded-full"
            />

            {/* Brand monogram */}
            <div className="w-20 h-20 bg-primary flex items-center justify-center">
              <span
                className="font-serif text-4xl text-primary-foreground tracking-tight select-none"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                G
              </span>
            </div>
          </motion.div>

          {/* Brand name + tagline */}
          <AnimatePresence>
            {phase === 'text' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 text-center"
              >
                <p
                  className="font-serif text-3xl tracking-[0.15em] text-foreground"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  GRAZEL
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Timeless Elegance
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slim progress bar */}
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 h-[2px] bg-primary"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
