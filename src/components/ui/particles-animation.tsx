import React, { useEffect, useRef } from "react";

interface ParticlesAnimationProps {
  isActive: boolean;
}

const ParticlesAnimation: React.FC<ParticlesAnimationProps> = ({
  isActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) {
      // Cancel animation if not active
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match parent
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    // Initial resize
    resizeCanvas();

    // Add resize listener
    window.addEventListener("resize", resizeCanvas);

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;
      connectDistance: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = "#ffffff";
        this.opacity = Math.random() * 0.5 + 0.2;
        this.connectDistance = 150;
      }

      update() {
        // Move particles
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges
        if (this.x > canvas.width || this.x < 0) {
          this.speedX = -this.speedX;
        }
        if (this.y > canvas.height || this.y < 0) {
          this.speedY = -this.speedY;
        }
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx!.fill();
      }

      connect(particles: Particle[]) {
        for (const particle of particles) {
          if (this === particle) continue;

          const dx = this.x - particle.x;
          const dy = this.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < this.connectDistance) {
            // Calculate opacity based on distance
            const opacity = 1 - distance / this.connectDistance;

            ctx!.beginPath();
            ctx!.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
            ctx!.lineWidth = 1;
            ctx!.moveTo(this.x, this.y);
            ctx!.lineTo(particle.x, particle.y);
            ctx!.stroke();
          }
        }
      }
    }

    // Create particles
    const particleCount = Math.min(
      Math.floor((canvas.width * canvas.height) / 10000),
      100,
    );
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      // Clear canvas with semi-transparent background for trail effect
      ctx!.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (const particle of particles) {
        particle.update();
        particle.draw();
      }

      // Connect particles with lines
      for (const particle of particles) {
        particle.connect(particles);
      }

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  return (
    <div
      className={`absolute inset-0 z-0 transition-opacity duration-500  backdrop-blur-md ${isActive ? "opacity-100" : "opacity-0"}`}
    >
      <canvas ref={canvasRef} className="w-full h-full backdrop-blur-md" />
    </div>
  );
};

export default ParticlesAnimation;
