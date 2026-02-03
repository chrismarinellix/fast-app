import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
}

interface Shape {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  velocityX: number;
  velocityY: number;
  type: number;
  opacity: number;
}

export function WebGPUBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDark } = useTheme();
  const [supported, setSupported] = useState(true);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use Canvas 2D for better compatibility and simpler starfield
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setSupported(false);
      return;
    }

    // Initialize stars
    const stars: Star[] = Array.from({ length: 150 }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random(),
      size: Math.random() * 1.5 + 0.5,
    }));

    // Initialize geometric shapes
    const shapes: Shape[] = Array.from({ length: 8 }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      size: 20 + Math.random() * 40,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.005,
      velocityX: (Math.random() - 0.5) * 0.3,
      velocityY: (Math.random() - 0.5) * 0.3,
      type: Math.floor(Math.random() * 4),
      opacity: 0.03 + Math.random() * 0.05,
    }));

    const handleResize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const drawStar = (x: number, y: number, size: number, alpha: number) => {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? `rgba(255, 255, 255, ${alpha})`
        : `rgba(34, 197, 94, ${alpha * 0.5})`;
      ctx.fill();
    };

    const drawTriangle = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.866, size * 0.5);
      ctx.lineTo(-size * 0.866, size * 0.5);
      ctx.closePath();
      ctx.strokeStyle = isDark
        ? `rgba(34, 197, 94, ${opacity})`
        : `rgba(34, 197, 94, ${opacity * 0.7})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    const drawSquare = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = isDark
        ? `rgba(34, 197, 94, ${opacity})`
        : `rgba(34, 197, 94, ${opacity * 0.7})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    };

    const drawHexagon = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = isDark
        ? `rgba(34, 197, 94, ${opacity})`
        : `rgba(34, 197, 94, ${opacity * 0.7})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    const drawCircle = (x: number, y: number, size: number, opacity: number) => {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.strokeStyle = isDark
        ? `rgba(34, 197, 94, ${opacity})`
        : `rgba(34, 197, 94, ${opacity * 0.7})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // Draw stars (parallax effect based on z)
      stars.forEach(star => {
        // Slow drift
        star.z -= 0.0003;
        if (star.z <= 0) {
          star.z = 1;
          star.x = Math.random() * 2 - 1;
          star.y = Math.random() * 2 - 1;
        }

        const scale = 1 / star.z;
        const screenX = (star.x * scale + 1) * width / 2;
        const screenY = (star.y * scale + 1) * height / 2;
        const alpha = (1 - star.z) * 0.6;
        const size = star.size * scale * 0.5;

        if (screenX > 0 && screenX < width && screenY > 0 && screenY < height) {
          drawStar(screenX, screenY, Math.min(size, 2), alpha);
        }
      });

      // Draw and update geometric shapes
      shapes.forEach(shape => {
        shape.x += shape.velocityX / width;
        shape.y += shape.velocityY / height;
        shape.rotation += shape.rotationSpeed;

        // Wrap around
        if (shape.x < -1.5) shape.x = 1.5;
        if (shape.x > 1.5) shape.x = -1.5;
        if (shape.y < -1.5) shape.y = 1.5;
        if (shape.y > 1.5) shape.y = -1.5;

        const screenX = (shape.x + 1) * width / 2;
        const screenY = (shape.y + 1) * height / 2;

        switch (shape.type) {
          case 0:
            drawTriangle(screenX, screenY, shape.size, shape.rotation, shape.opacity);
            break;
          case 1:
            drawSquare(screenX, screenY, shape.size, shape.rotation, shape.opacity);
            break;
          case 2:
            drawHexagon(screenX, screenY, shape.size, shape.rotation, shape.opacity);
            break;
          case 3:
            drawCircle(screenX, screenY, shape.size, shape.opacity);
            break;
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDark]);

  if (!supported) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
