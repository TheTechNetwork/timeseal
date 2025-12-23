'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRevealAnimation } from '@/lib/ui/hooks';

interface TextScrambleProps {
    children: string;
    className?: string;
    duration?: number;
}

export function TextScramble({ children, className = '', duration = 1.5 }: TextScrambleProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const displayText = isInView ? useRevealAnimation(children, duration) : '';

    return (
        <span ref={ref} className={className}>
            {displayText.split('').map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                >
                    {char}
                </motion.span>
            ))}
        </span>
    );
}
