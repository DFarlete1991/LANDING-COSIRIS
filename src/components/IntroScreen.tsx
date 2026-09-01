import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TextRotate } from '@/components/ui/text-rotate';

type IntroScreenProps = {
  onComplete: () => void;
};

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [shownIndex, setShownIndex] = useState(-1);
  const texts = useMemo(
    () => ['VENDEDORES', 'EXCLUSIVAS', 'RESULTADOS'],
    [],
  );

  useEffect(() => {
    if (!isExiting) return;
    const doneTimer = setTimeout(onComplete, 700);
    return () => clearTimeout(doneTimer);
  }, [isExiting, onComplete]);

  const handleStep = (index: number) => {
    setShownIndex(index);
    if (index === 2) {
      setTimeout(() => setIsExiting(true), 1400);
    }
  };

  const handleSkip = () => {
    if (!isExiting) {
      setIsExiting(true);
    }
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.section
          onClick={handleSkip}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-white cursor-pointer"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.985, filter: 'blur(2px)' }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative flex flex-col items-center justify-center w-full max-w-4xl px-4 pointer-events-none">
            <motion.div
              className="flex flex-col items-center gap-2 text-3xl font-light sm:flex-row sm:items-baseline sm:text-5xl md:text-6xl relative z-20"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>Conseguimos</span>
              <TextRotate
                texts={texts}
                mainClassName="overflow-hidden rounded-lg bg-primary px-2 py-1 text-white sm:px-3 sm:py-1 shadow-md"
                splitLevelClassName="overflow-hidden"
                staggerFrom="last"
                staggerDuration={0.02}
                firstRotationInterval={900}
                rotationInterval={1500}
                loop={false}
                onNext={handleStep}
              />
            </motion.div>
            
            <div className="absolute top-[120%] flex flex-col items-center sm:items-end sm:pr-[40px] md:pr-[80px] w-full gap-2.5 z-10 pointer-events-none">
              {texts.map((text, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ 
                    opacity: i < shownIndex ? 0.4 : (i === shownIndex ? 0 : 0), 
                    y: i < shownIndex ? 0 : -20,
                    scale: i < shownIndex ? 1 : 0.9
                  }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.1 
                  }}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium tracking-[0.2em] text-slate-400"
                >
                  <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  {text}
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-8 text-xs text-gray-400 font-light pointer-events-none tracking-widest uppercase"
          >
            Haz clic en la pantalla para saltar
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
