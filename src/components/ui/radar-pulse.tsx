import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";

interface RadarPulseProps {
  className?: string;
  containerClassName?: string;
  ringCount?: number;
  pulseSpeed?: number;
  size?: number;
  color?: string;
  splashIntensity?: number;
  lineWidth?: number;
  children?: React.ReactNode;
}

export const RadarPulse = (props: RadarPulseProps) => {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);

  // State for fade-in animation
  const [isVisible, setIsVisible] = useState(false);

  // Animation properties
  const ringCount = props.ringCount || 3;
  const pulseSpeed = props.pulseSpeed || 1;
  const size = props.size || 500;
  const splashIntensity = props.splashIntensity || 0.5;
  const lineWidth = props.lineWidth || 4;

  // Calculate color based on theme or prop
  const getColor = useCallback(() => {
    if (props.color) return props.color;
    return resolvedTheme === "dark" ? "#3b82f6" : "#1e40af";
  }, [props.color, resolvedTheme]);

  // Draw the splash/ripple wave animation
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Center coordinates
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.9;

    // Get current time for animations
    const time = performance.now() * 0.001; // seconds

    // Draw rings
    const color = getColor();
    ctx.strokeStyle = color;

    // Draw expanding splash circles
    for (let i = 0; i < ringCount; i++) {
      // Calculate phase for spacing
      const phase = (time * pulseSpeed + i / ringCount) % 1;
      const baseRadius = maxRadius * phase;

      // Skip very small circles
      if (baseRadius < 15) continue;

      // Fade out as it expands
      const alpha = 1 - phase;
      ctx.globalAlpha = alpha * 0.8;

      // Calculate dynamic line width - thicker at the beginning, thinner as it expands
      const dynamicLineWidth = lineWidth * (1.6 - phase * 1.2);
      ctx.lineWidth = dynamicLineWidth;

      // Draw a clean circle with subtle splash effect
      ctx.beginPath();

      // Increase number of points for smoother curves
      const numPoints = 100;
      const angleStep = (Math.PI * 2) / numPoints;

      // Arrays to store points for bezier curve calculation
      const points: Array<{ x: number; y: number }> = [];

      // First generate all points
      for (let j = 0; j < numPoints; j++) {
        const angle = j * angleStep;

        // Create a subtle splash effect using sin waves with the current time
        // This creates a gentle ripple that changes as it expands
        const waveFreq = 3 + (i % 2); // Different frequency for each ring
        const splashOffset =
          Math.sin(angle * waveFreq + time * 2) *
          (baseRadius * 0.03 * splashIntensity);

        // Add a second wave with different frequency for more natural look
        const splash2Offset =
          Math.sin(angle * (waveFreq * 1.7) + time * 1.5) *
          (baseRadius * 0.02 * splashIntensity);

        // Calculate the final radius with splash effect
        const radius = baseRadius + splashOffset + splash2Offset;

        // Store the point
        points.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
      }

      // Close the loop by adding the first point again
      if (points.length > 0 && points[0]) {
        points.push({
          x: points[0].x,
          y: points[0].y,
        });
      }

      // Now draw smooth bezier curves between points
      if (points.length > 1) {
        // Start at the first point safely
        if (points[0]) {
          ctx.moveTo(points[0].x, points[0].y);

          // Draw curved segments using bezier curves for ultra smooth appearance
          for (let j = 0; j < points.length - 1; j++) {
            const current = points[j];
            const next = points[j + 1];

            // For extra-smooth curves, use catmull-rom spline approximation with bezier curves
            // Get points for control handles with safe index access
            const prevIndex = (j - 1 + points.length - 1) % (points.length - 1);
            const nextNextIndex = (j + 2) % (points.length - 1);

            // Make sure we have all the necessary points with proper null checks
            if (current && next && points[prevIndex] && points[nextNextIndex]) {
              const prev = points[prevIndex];
              const nextNext = points[nextNextIndex];

              // Calculate control points for a smooth curve
              // This tension parameter controls how much the curve bends
              const tension = 0.2; // Lower values make smoother curves

              // Control point after current point - using catmull-rom to bezier approximation
              const cp1x = current.x + (next.x - prev.x) * tension;
              const cp1y = current.y + (next.y - prev.y) * tension;

              // Control point before next point
              const cp2x = next.x - (nextNext.x - current.x) * tension;
              const cp2y = next.y - (nextNext.y - current.y) * tension;

              // Draw a bezier curve to the next point
              ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
            } else {
              // Fallback to simpler line if we don't have all points
              if (current && next) {
                ctx.lineTo(next.x, next.y);
              }
            }
          }

          ctx.closePath();
          ctx.stroke();

          // Add a subtle glow effect for larger circles
          if (baseRadius > maxRadius * 0.3) {
            ctx.save();
            ctx.strokeStyle = color + "40"; // Add transparency
            ctx.lineWidth = dynamicLineWidth * 1.5;
            ctx.stroke();
            ctx.restore();
          }
        }

        // Reset global alpha
        ctx.globalAlpha = 1;

        // Draw center dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset global alpha
      ctx.globalAlpha = 1;

      // Draw center dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Continue animation loop
    animationIdRef.current = requestAnimationFrame(draw);
  }, [getColor, ringCount, pulseSpeed, size, lineWidth, splashIntensity]);

  // Setup and cleanup animation
  useEffect(() => {
    // Start animation
    draw();

    // Trigger fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100); // Small delay for better effect

    // Cleanup on unmount
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
      clearTimeout(timer);
    };
  }, [draw]);

  return (
    <div className={cn("absolute h-full w-full", props.containerClassName)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.97,
        }}
        transition={{
          duration: 1.2,
          ease: "easeOut",
        }}
        className="absolute inset-0 z-0 flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="max-w-full max-h-full"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className={cn("relative z-10", props.className)}
      >
        {props.children}
      </motion.div>
    </div>
  );
};
