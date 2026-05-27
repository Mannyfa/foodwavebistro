import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';

export default function SlideToOrder({ onConfirm, isSubmitting }) {
  const [confirmed, setConfirmed] = useState(false);
  const x = useMotionValue(0);
  
  // Constrain the drag to 0px to 250px (track width)
  const constraints = { left: 0, right: 250 };
  
  // Transform the drag position to opacity
  const opacity = useTransform(x, [0, 200], [1, 0]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 200) {
      setConfirmed(true);
      onConfirm();
    } else {
      x.set(0);
    }
  };

  return (
    <div className="relative w-full h-16 bg-white/5 border border-white/10 rounded-full overflow-hidden flex items-center p-1 select-none">
      <motion.div
        drag="x"
        dragConstraints={constraints}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`absolute z-20 w-14 h-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xl ${confirmed ? 'bg-green-500' : 'bg-brand-orange'}`}
      >
        {confirmed ? <Check className="text-white w-6 h-6" /> : <ChevronRight className="text-white w-6 h-6" />}
      </motion.div>
      
      <motion.span 
        style={{ opacity }}
        className="absolute left-20 text-[10px] font-bold tracking-widest uppercase text-gray-400 pointer-events-none"
      >
        {isSubmitting ? 'Processing...' : 'Slide to confirm order'}
      </motion.span>
    </div>
  );
}