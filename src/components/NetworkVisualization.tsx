import { useEffect, useRef, useCallback } from 'react';

interface PhysicsNode {
  id: string;
  name: string;
  isYou?: boolean;
  isFasting: boolean;
  fastingHours: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Each node gets a unique phase offset for organic movement
  phase: number;
}

// Fasting stage symbols based on hours
function getStageInfo(hours: number): { symbol: string; label: string; color: string } | null {
  if (hours < 4) return null;
  if (hours < 8) return { symbol: '⚡', label: 'Fat burn', color: '#f97316' };
  if (hours < 12) return { symbol: '🔥', label: 'Ketosis', color: '#ef4444' };
  if (hours < 16) return { symbol: '🧠', label: 'Clarity', color: '#3b82f6' };
  if (hours < 24) return { symbol: '✨', label: 'Autophagy', color: '#10b981' };
  return { symbol: '🌟', label: 'Renewal', color: '#a855f7' };
}

interface NetworkVisualizationProps {
  you: { name: string; isFasting: boolean; fastingHours?: number };
  connections: { id: string; name: string; isFasting: boolean; fastingHours?: number }[];
  onNodeClick?: (nodeId: string) => void;
  isDark?: boolean;
}

export function NetworkVisualization({ you, connections, onNodeClick, isDark = true }: NetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const nodesRef = useRef<PhysicsNode[]>([]);
  const timeRef = useRef(0);
  const initializedRef = useRef(false);
  const dragRef = useRef<{ nodeId: string; startX: number; startY: number; moved: boolean } | null>(null);

  // Get canvas-relative coords from mouse or touch event
  const getCanvasCoords = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      const te = e as TouchEvent;
      if (te.touches.length > 0) {
        clientX = te.touches[0].clientX;
        clientY = te.touches[0].clientY;
      } else if (te.changedTouches?.length > 0) {
        clientX = te.changedTouches[0].clientX;
        clientY = te.changedTouches[0].clientY;
      } else return null;
    } else {
      const me = e as MouseEvent;
      clientX = me.clientX;
      clientY = me.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  // Find node under a point
  const findNodeAt = useCallback((px: number, py: number) => {
    for (const node of nodesRef.current) {
      const dx = node.x - px;
      const dy = node.y - py;
      if (Math.sqrt(dx * dx + dy * dy) < 22) return node;
    }
    return null;
  }, []);

  // Drag start
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCanvasCoords(e as any);
    if (!coords) return;
    const node = findNodeAt(coords.x, coords.y);
    if (node) {
      dragRef.current = { nodeId: node.id, startX: coords.x, startY: coords.y, moved: false };
    }
  }, [getCanvasCoords, findNodeAt]);

  // Drag move
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const coords = getCanvasCoords(e);
      if (!coords) return;
      const dx = coords.x - dragRef.current.startX;
      const dy = coords.y - dragRef.current.startY;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) dragRef.current.moved = true;
      // Only reposition if actually dragging (past threshold)
      if (dragRef.current.moved) {
        const node = nodesRef.current.find(n => n.id === dragRef.current!.nodeId);
        if (node) {
          node.x = coords.x;
          node.y = coords.y;
          node.vx = 0;
          node.vy = 0;
        }
      }
    };

    const onUp = () => {
      if (!dragRef.current) return;
      const wasDrag = dragRef.current.moved;
      const nodeId = dragRef.current.nodeId;
      dragRef.current = null;
      // If it was a tap (not a drag) on a friend node, trigger click
      if (!wasDrag && onNodeClick) {
        const node = nodesRef.current.find(n => n.id === nodeId);
        if (node && !node.isYou) {
          onNodeClick(nodeId);
        }
      }
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [getCanvasCoords, onNodeClick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;
    const centerX = width / 2;
    const centerY = height / 2;

    const edges = connections.map(c => ({ source: 'you', target: c.id }));

    // Initialize nodes — "You" at center, friends spread around
    if (!initializedRef.current || nodesRef.current.length !== connections.length + 1) {
      const allNodes: PhysicsNode[] = [
        { id: 'you', name: you.name, isYou: true, isFasting: you.isFasting, fastingHours: you.fastingHours || 0, x: centerX, y: centerY, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2 },
      ];
      connections.forEach((c, i) => {
        const angle = (i / Math.max(connections.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const spread = Math.min(width, height) * 0.28;
        allNodes.push({
          id: c.id, name: c.name, isFasting: c.isFasting, fastingHours: c.fastingHours || 0,
          x: centerX + Math.cos(angle) * spread,
          y: centerY + Math.sin(angle) * spread,
          vx: 0, vy: 0,
          phase: Math.random() * Math.PI * 2,
        });
      });
      nodesRef.current = allNodes;
      initializedRef.current = true;
    } else {
      nodesRef.current[0].isFasting = you.isFasting;
      nodesRef.current[0].fastingHours = you.fastingHours || 0;
      connections.forEach((c, i) => {
        const node = nodesRef.current[i + 1];
        if (node) {
          node.isFasting = c.isFasting;
          node.fastingHours = c.fastingHours || 0;
        }
      });
    }

    // Gentle physics — no spinning, just soft repulsion + edge springs + center gravity
    const REPULSION = 800;
    const ATTRACTION = 0.003;
    const DAMPING = 0.92;
    const CENTER_GRAVITY = 0.002;

    const animate = () => {
      const nodes = nodesRef.current;
      timeRef.current += 0.016;
      const time = timeRef.current;

      // Background with subtle radial glow at center
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.7);
      if (isDark) {
        bgGradient.addColorStop(0, '#1a2332');
        bgGradient.addColorStop(0.5, '#121c2b');
        bgGradient.addColorStop(1, '#0c1421');
      } else {
        bgGradient.addColorStop(0, '#f8fafc');
        bgGradient.addColorStop(0.5, '#f1f5f9');
        bgGradient.addColorStop(1, '#e8edf3');
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle background dots
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)';
      for (let s = 0; s < 30; s++) {
        const sx = ((s * 137.5 + 42) % width);
        const sy = ((s * 97.3 + 18) % height);
        const twinkle = Math.sin(time * 0.5 + s * 1.7) * 0.5 + 0.5;
        ctx.globalAlpha = isDark ? (0.05 + twinkle * 0.12) : (0.3 + twinkle * 0.4);
        ctx.beginPath();
        ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Physics — skip dragged node
      const draggedId = dragRef.current?.nodeId;
      nodes.forEach((node, i) => {
        if (node.id === draggedId) return; // skip physics for dragged node
        // Repulsion from other nodes
        nodes.forEach((other, j) => {
          if (i === j) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = REPULSION / (dist * dist);
          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;
        });

        // Gentle center gravity
        node.vx += (centerX - node.x) * CENTER_GRAVITY;
        node.vy += (centerY - node.y) * CENTER_GRAVITY;

        // Gentle organic drift — each node breathes differently, no spinning
        node.vx += Math.sin(time * 0.3 + node.phase) * 0.04;
        node.vy += Math.cos(time * 0.25 + node.phase * 1.3) * 0.04;
      });

      // Edge spring attraction
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist * ATTRACTION;
        source.vx += (dx / dist) * force;
        source.vy += (dy / dist) * force;
        target.vx -= (dx / dist) * force;
        target.vy -= (dy / dist) * force;
      });

      // Apply velocity with damping — skip dragged node
      const margin = 24;
      nodes.forEach(node => {
        if (node.id === draggedId) return;
        node.vx *= DAMPING;
        node.vy *= DAMPING;
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(margin, Math.min(width - margin, node.x));
        node.y = Math.max(margin, Math.min(height - margin, node.y));
      });

      // Draw edges — glassmorphic glowing lines with energy particles
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        const bothFasting = source.isFasting && target.isFasting;

        // Line glow
        ctx.save();
        ctx.shadowColor = bothFasting ? 'rgba(34,197,94,0.4)' : 'rgba(139,92,246,0.25)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = bothFasting ? 'rgba(34,197,94,0.35)' : 'rgba(139,92,246,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.restore();

        // Crisp inner line
        ctx.strokeStyle = bothFasting ? 'rgba(34,197,94,0.6)' : 'rgba(139,92,246,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        // Energy particles flowing along connection
        for (let p = 0; p < 2; p++) {
          const t = ((time * 0.3 + p * 0.5) % 1);
          const px = source.x + (target.x - source.x) * t;
          const py = source.y + (target.y - source.y) * t;
          const alpha = Math.sin(t * Math.PI) * 0.8; // fade in/out

          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = bothFasting ? `rgba(34,197,94,${alpha})` : `rgba(139,92,246,${alpha * 0.8})`;
          ctx.shadowColor = bothFasting ? 'rgba(34,197,94,0.6)' : 'rgba(139,92,246,0.4)';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw nodes — glassmorphic orbs
      nodes.forEach((node) => {
        const x = node.x;
        const y = node.y;
        const r = node.isYou ? 14 : 11;

        // Breathing scale for fasting users
        const breath = node.isFasting ? Math.sin(time * 1.5 + node.phase) * 0.08 + 1 : 1;
        const drawR = r * breath;

        // Outer aura for fasting
        if (node.isFasting) {
          const aura = ctx.createRadialGradient(x, y, drawR, x, y, drawR * 2.5);
          aura.addColorStop(0, 'rgba(34,197,94,0.2)');
          aura.addColorStop(0.6, 'rgba(34,197,94,0.05)');
          aura.addColorStop(1, 'rgba(34,197,94,0)');
          ctx.beginPath();
          ctx.arc(x, y, drawR * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = aura;
          ctx.fill();

          // Breathing ring
          const ringPulse = Math.sin(time * 1.5 + node.phase + 1) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, drawR + 3 + ringPulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34,197,94,${0.15 + ringPulse * 0.2})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Glassmorphic orb: radial gradient with transparency
        const orbGrad = ctx.createRadialGradient(
          x - drawR * 0.3, y - drawR * 0.35, drawR * 0.1,
          x, y, drawR
        );
        if (node.isFasting) {
          orbGrad.addColorStop(0, 'rgba(134,239,172,0.95)');
          orbGrad.addColorStop(0.4, 'rgba(34,197,94,0.85)');
          orbGrad.addColorStop(1, 'rgba(22,163,74,0.7)');
        } else {
          orbGrad.addColorStop(0, 'rgba(196,181,253,0.85)');
          orbGrad.addColorStop(0.4, 'rgba(139,92,246,0.7)');
          orbGrad.addColorStop(1, 'rgba(99,102,241,0.55)');
        }

        ctx.save();
        ctx.shadowColor = node.isFasting ? 'rgba(34,197,94,0.5)' : 'rgba(139,92,246,0.35)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = orbGrad;
        ctx.fill();
        ctx.restore();

        // Glass highlight — bright specular reflection at top-left
        const highlight = ctx.createRadialGradient(
          x - drawR * 0.35, y - drawR * 0.35, 0,
          x - drawR * 0.1, y - drawR * 0.1, drawR * 0.7
        );
        highlight.addColorStop(0, 'rgba(255,255,255,0.55)');
        highlight.addColorStop(0.4, 'rgba(255,255,255,0.15)');
        highlight.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(x, y, drawR * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = highlight;
        ctx.fill();

        // Subtle glass border
        ctx.beginPath();
        ctx.arc(x, y, drawR, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label inside orb
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${node.isYou ? 9 : 8}px system-ui, -apple-system, sans-serif`;
        const label = node.isYou ? 'You' : (node.name.length > 4 ? node.name[0].toUpperCase() : node.name);
        ctx.fillText(label, x, y);

        // Name below orb — with background pill so lines don't clash
        const nameText = node.name.length > 10 ? node.name.substring(0, 10) : node.name;
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        const nameW = ctx.measureText(nameText).width;
        const nameY = y + drawR + 11;
        // Background pill
        ctx.fillStyle = isDark ? 'rgba(15,20,33,0.75)' : 'rgba(241,245,249,0.8)';
        ctx.beginPath();
        const pillPad = 3;
        ctx.roundRect(x - nameW / 2 - pillPad, nameY - 6, nameW + pillPad * 2, 12, 3);
        ctx.fill();
        // Name text
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
        ctx.fillText(nameText, x, nameY);

        // Chat indicator on friend orbs
        if (!node.isYou && onNodeClick) {
          const bx = x + drawR * 0.7;
          const by = y - drawR * 0.7;
          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 3;
          ctx.fill();
          ctx.restore();
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          for (let d = -1; d <= 1; d++) {
            ctx.beginPath();
            ctx.arc(bx + d * 2, by, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Fasting stage indicator — symbol below name
        if (node.isFasting && node.fastingHours >= 4) {
          const stage = getStageInfo(node.fastingHours);
          if (stage) {
            ctx.font = '11px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(stage.symbol, x, y + drawR + 22);
          }
        }
      });

      // Legend — vertical box, left side
      const legendTextColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
      const legendItems = [
        { dot: '#22c55e', label: 'Fasting' },
        { dot: '#8b5cf6', label: 'Idle' },
        { symbol: '⚡', label: '4h+' },
        { symbol: '🔥', label: '8h+' },
        { symbol: '🧠', label: '12h+' },
        { symbol: '✨', label: '16h+' },
        { symbol: '🌟', label: '24h+' },
      ];
      const lx = 6;
      const ly = 8;
      const lineH = 13;
      const boxH = legendItems.length * lineH + 8;
      const boxW = 58;

      // Box background
      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(15,20,33,0.6)' : 'rgba(255,255,255,0.5)';
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.roundRect(lx, ly, boxW, boxH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '8px system-ui, -apple-system, sans-serif';
      legendItems.forEach((item, idx) => {
        const iy = ly + 10 + idx * lineH;
        if (item.dot) {
          ctx.beginPath();
          ctx.arc(lx + 9, iy, 3, 0, Math.PI * 2);
          ctx.fillStyle = item.dot;
          ctx.fill();
          ctx.fillStyle = legendTextColor;
          ctx.fillText(item.label, lx + 16, iy);
        } else {
          ctx.fillStyle = legendTextColor;
          ctx.fillText(`${item.symbol} ${item.label}`, lx + 5, iy);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [you, connections, onNodeClick, isDark]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        borderRadius: 12,
        cursor: 'grab',
        touchAction: 'none',
      }}
    />
  );
}
