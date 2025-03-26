"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export const FlipWords = ({
  words = [], // Default to empty array to prevent undefined errors
  duration = 3000,
  className,
  repeat = true,
  onComplete,
}: {
  words: string[];
  duration?: number;
  className?: string;
  repeat?: boolean;
  onComplete?: () => void;
}) => {
  // Default to empty string if words array is empty
  const [currentWord, setCurrentWord] = useState<string>(words[0] || "");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [isFinalWord, setIsFinalWord] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // thanks for the fix Julian - https://github.com/Julian-AT
  const startAnimation = useCallback(() => {
    if (words.length === 0) return; // Guard clause for empty arrays

    // Check if we've shown all words and shouldn't repeat
    if (wordIndex >= words.length - 1 && !repeat) {
      // This is the final word - mark it so we can apply special animation
      setIsFinalWord(true);

      // Trigger fade out animation
      setTimeout(() => {
        setIsFadingOut(true);
      }, duration);

      // Set a timeout to trigger the completion callback
      setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, duration + 1500); // Additional time for fade-out

      return;
    }

    // Calculate next word index, cycling back to beginning if needed
    const nextIndex = (wordIndex + 1) % words.length;
    setWordIndex(nextIndex);

    // Get the next word or empty string as fallback
    const nextWord = words[nextIndex] || "";

    setCurrentWord(nextWord);
    setIsAnimating(true);
  }, [wordIndex, words, repeat, onComplete, duration]);

  useEffect(() => {
    if (!isAnimating && !isComplete && words.length > 0) {
      const timer = setTimeout(() => {
        startAnimation();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isAnimating, duration, startAnimation, words, isComplete]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsAnimating(false);
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: isFadingOut ? 0 : 1,
          y: 0,
        }}
        transition={{
          opacity: { duration: isFadingOut ? 1.5 : 0.3, ease: "easeOut" },
          y: { type: "spring", stiffness: 100, damping: 10 },
        }}
        exit={
          isFinalWord
            ? {
                opacity: 0,
                transition: { duration: 1.5, ease: "easeOut" },
              }
            : {
                opacity: 0,
                y: -40,
                x: 40,
                filter: "blur(8px)",
                scale: 2,
                position: "absolute",
              }
        }
        className={cn(
          "z-10 inline-block relative text-left text-neutral-900 dark:text-neutral-100 px-2",
          className,
        )}
        key={currentWord}
      >
        {currentWord?.split(" ").map((word, wordIndex) => (
          <motion.span
            key={word + wordIndex}
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{
              opacity: isFadingOut ? 0 : 1,
              y: 0,
              filter: "blur(0px)",
            }}
            transition={{
              opacity: {
                duration: isFadingOut ? 1.5 : 0.3,
                delay: isFadingOut ? 0 : wordIndex * 0.3,
              },
              y: { duration: 0.3, delay: wordIndex * 0.3 },
              filter: { duration: 0.3, delay: wordIndex * 0.3 },
            }}
            className="inline-block whitespace-nowrap"
          >
            {word.split("").map((letter, letterIndex) => (
              <motion.span
                key={word + letterIndex}
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{
                  opacity: isFadingOut ? 0 : 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                transition={{
                  opacity: {
                    duration: isFadingOut ? 1.5 : 0.2,
                    delay: isFadingOut
                      ? 0
                      : wordIndex * 0.3 + letterIndex * 0.05,
                  },
                  y: {
                    duration: 0.2,
                    delay: wordIndex * 0.3 + letterIndex * 0.05,
                  },
                  filter: {
                    duration: 0.2,
                    delay: wordIndex * 0.3 + letterIndex * 0.05,
                  },
                }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
            <span className="inline-block">&nbsp;</span>
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
