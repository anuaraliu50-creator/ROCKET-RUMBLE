import React, { useEffect, useRef } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { audioService } from '../services/audioService';

interface CutsceneProps {
  onComplete: () => void;
}

const Cutscene: React.FC<CutsceneProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  // Debris for explosion
  const debrisRef = useRef<{x: number, y: number, vx: number, vy: number, rot: number, vRot: number, color: string, size: number}[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    audioService.init();
    startTimeRef.current = performance.now();
    
    // Initialize debris
    for(let i=0; i<30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 10 + 5;
        debrisRef.current.push({
            x: CANVAS_WIDTH/2,
            y: CANVAS_HEIGHT/2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            rot: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 0.5,
            color: Math.random() > 0.5 ? '#ef4444' : '#333',
            size: Math.random() * 20 + 5
        });
    }

    const render = (time: number) => {
      const elapsed = (time - startTimeRef.current) / 1000; // seconds
      
      // --- Style Setup ---
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // --- Camera Logic ---
      let zoom = 1;
      let camX = 0;
      let camY = 0;

      // Zoom in during the chaos/crash (6s - 8s)
      if (elapsed > 5.5 && elapsed < 8) {
          const t = (elapsed - 5.5) / 2.5;
          zoom = 1 + t * 0.5; // Zoom up to 1.5x
          // Pan towards center roughly
          camX = -((CANVAS_WIDTH * zoom - CANVAS_WIDTH) / 2);
          camY = -((CANVAS_HEIGHT * zoom - CANVAS_HEIGHT) / 2);
      } else if (elapsed >= 8) {
           zoom = 1.0; // Reset for explosion frame usually, or keep zoomed? Let's reset for big impact view
      }

      // Camera Shake
      let shake = 0;
      if (elapsed > 6 && elapsed < 7) shake = 5;
      else if (elapsed > 7 && elapsed < 8) shake = 15;
      else if (elapsed > 8 && elapsed < 8.5) shake = 40; // BIG IMPACT

      if (shake > 0) {
        camX += (Math.random() - 0.5) * shake;
        camY += (Math.random() - 0.5) * shake;
      }

      // Apply Camera
      ctx.save();
      ctx.translate(camX, camY);
      ctx.scale(zoom, zoom);

      // --- Background ---
      // Deep Space Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#020617'); // Slate 950
      grad.addColorStop(1, '#1e1b4b'); // Indigo 950
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Note: Should probably be larger for shake/zoom but simple solid color works

      // Parallax Stars
      drawStars(ctx, elapsed);

      // Speed Lines (Add sense of velocity)
      if (elapsed < 6) {
          drawSpeedLines(ctx, elapsed);
      }

      // --- Timeline Logic ---
      // 0-3s: Intro flight
      // 3-5s: The Jump (Swap)
      // 5-7s: Chaos/Spin
      // 7-8s: Crash
      // 8s+: Explosion

      // --- Actors Calculation ---
      
      const baseSpeed = 100;
      
      // Rocket A (Monkey - Blue)
      let rAx = -50 + elapsed * (baseSpeed * 0.8); 
      let rAy = 200 + Math.sin(elapsed * 2) * 10;
      let rARot = Math.sin(elapsed * 1) * 0.05;

      // Rocket B (Tiger - Red)
      let rBx = -250 + elapsed * (baseSpeed * 1.2);
      let rBy = 380 + Math.cos(elapsed * 2.5) * 10;
      let rBRot = Math.sin(elapsed * 1.5) * 0.05;

      // Chaos Phase Modifications
      if (elapsed > 5) {
        rAy += Math.sin(elapsed * 15) * 5;
        rBy += Math.cos(elapsed * 15) * 5;
        rARot += Math.sin(elapsed * 10) * 0.1;
        rBRot += Math.cos(elapsed * 10) * 0.1;

        if (elapsed > 6.5) {
             const crashT = easeInQuad(Math.min(1, (elapsed - 6.5) / 1.5)); 
             const targetX = CANVAS_WIDTH / 2;
             const targetY = CANVAS_HEIGHT / 2;
             
             rAx = lerp(rAx, targetX - 50, crashT);
             rAy = lerp(rAy, targetY, crashT);
             rBx = lerp(rBx, targetX + 50, crashT);
             rBy = lerp(rBy, targetY, crashT);
             
             rARot += crashT * 2;
             rBRot -= crashT * 2;
        }
      }

      // --- Draw Rockets & Drivers ---
      
      if (elapsed < 8.05) { // Visible until just after explosion start
        // Draw Rocket A (Monkey)
        ctx.save();
        ctx.translate(rAx, rAy);
        ctx.rotate(rARot);
        // Squash stretch on acceleration
        if (elapsed > 6.5) ctx.scale(1.1, 0.9);
        drawCartoonRocket(ctx, '#3b82f6', '#1d4ed8', elapsed); 
        // Driver: Monkey
        ctx.save();
        ctx.translate(20, -15);
        ctx.scale(0.8, 0.8);
        drawCharacterHead(ctx, 'MONKEY', elapsed);
        ctx.restore();
        ctx.restore();

        // Draw Rocket B (Tiger)
        ctx.save();
        ctx.translate(rBx, rBy);
        ctx.rotate(rBRot);
        if (elapsed > 6.5) ctx.scale(1.1, 0.9);
        drawCartoonRocket(ctx, '#ef4444', '#b91c1c', elapsed); 
        // Driver: Tiger
        ctx.save();
        ctx.translate(20, -15);
        ctx.scale(0.8, 0.8);
        drawCharacterHead(ctx, 'TIGER', elapsed);
        ctx.restore();
        ctx.restore();

        // --- Riders ---
        if (elapsed < 3) {
           // Phase 1: Riding
           // Panda
           ctx.save(); ctx.translate(rAx - 20, rAy - 25); ctx.rotate(rARot + 0.1); 
           drawFullCharacter(ctx, 'PANDA', elapsed, false); ctx.restore();

           // Bear
           ctx.save(); ctx.translate(rBx - 20, rBy - 25); ctx.rotate(rBRot + 0.1);
           drawFullCharacter(ctx, 'BEAR', elapsed, false); ctx.restore();
        } 
        else if (elapsed >= 3 && elapsed < 4.5) {
           // Phase 2: Jump (Smoother)
           const linearT = (elapsed - 3) / 1.5;
           const t = easeInOutCubic(linearT); // Better animation curve
           
           // Panda Jump
           const pX = lerp(rAx - 20, rBx - 20, t);
           const pY = lerp(rAy - 25, rBy - 25, t) - Math.sin(t * Math.PI) * 180;
           const pRot = t * Math.PI * 2;
           
           ctx.save(); ctx.translate(pX, pY); ctx.rotate(pRot);
           drawFullCharacter(ctx, 'PANDA', elapsed, true); ctx.restore();

           // Bear Jump
           const bX = lerp(rBx - 20, rAx - 20, t);
           const bY = lerp(rBy - 25, rAy - 25, t) - Math.sin(t * Math.PI) * 180;
           const bRot = -t * Math.PI * 2;
           
           ctx.save(); ctx.translate(bX, bY); ctx.rotate(bRot);
           drawFullCharacter(ctx, 'BEAR', elapsed, true); ctx.restore();
        }
        else {
           // Phase 3: Fighting on rockets (Clinging on)
           const balance = Math.sin(elapsed * 10) * 0.2;
           
           // Panda on Tiger Rocket (B)
           ctx.save(); ctx.translate(rBx - 10, rBy - 35); ctx.rotate(rBRot + balance);
           drawFullCharacter(ctx, 'PANDA', elapsed, false); ctx.restore();

           // Bear on Monkey Rocket (A)
           ctx.save(); ctx.translate(rAx - 10, rAy - 35); ctx.rotate(rARot - balance);
           drawFullCharacter(ctx, 'BEAR', elapsed, false); ctx.restore();
        }
      }

      // Planet Background (Approaching)
      if (elapsed > 5) {
          const t = Math.min(1, (elapsed - 5) / 3);
          const easeT = t * t; // Acceleration
          const size = easeT * 800; // Bigger planet
          const yPos = CANVAS_HEIGHT + 500 - easeT * 600;
          
          ctx.save();
          ctx.translate(CANVAS_WIDTH/2, yPos);
          ctx.rotate(elapsed * 0.1);
          
          // Planet Body
          ctx.fillStyle = '#2563eb';
          ctx.strokeStyle = 'black'; ctx.lineWidth = 10;
          ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          
          // Planet Detail
          ctx.fillStyle = '#1d4ed8';
          ctx.beginPath(); ctx.arc(-size*0.3, -size*0.2, size*0.15, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(size*0.4, size*0.1, size*0.1, 0, Math.PI*2); ctx.fill();
          
          ctx.restore();
      }

      // Explosion
      if (elapsed > 8) {
        const expT = elapsed - 8;
        
        // Initial Flash
        if (expT < 0.1) {
            ctx.fillStyle = 'white';
            ctx.fillRect(-1000, -1000, 3000, 3000); // Cover everything even with camera shake
            if (Math.random() > 0.5) audioService.playExplosion();
        } else {
             // 1. Shockwave
             ctx.strokeStyle = 'white';
             ctx.lineWidth = 10 - expT * 5;
             ctx.globalAlpha = Math.max(0, 1 - expT);
             ctx.beginPath();
             ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, expT * 1000, 0, Math.PI*2);
             ctx.stroke();
             ctx.globalAlpha = 1;

             // 2. Fireballs
             const radius = expT * 500;
             const alpha = Math.max(0, 1 - expT * 0.4);
             
             ctx.globalAlpha = alpha;
             ctx.fillStyle = '#f59e0b'; // Amber
             ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, radius, 0, Math.PI*2); ctx.fill();
             
             ctx.fillStyle = '#ef4444'; // Red inner
             ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, radius * 0.7, 0, Math.PI*2); ctx.fill();
             
             ctx.fillStyle = '#ffffff'; // White core
             ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, radius * 0.3, 0, Math.PI*2); ctx.fill();
             ctx.globalAlpha = 1;

             // 3. Debris flying out
             debrisRef.current.forEach(d => {
                d.x += d.vx;
                d.y += d.vy;
                d.rot += d.vRot;
                
                ctx.save();
                ctx.translate(d.x, d.y);
                ctx.rotate(d.rot);
                ctx.fillStyle = d.color;
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.fillRect(-d.size/2, -d.size/2, d.size, d.size);
                ctx.strokeRect(-d.size/2, -d.size/2, d.size, d.size);
                ctx.restore();
             });
        }

        if (expT > 2.5) {
            onComplete();
        }
      }

      ctx.restore(); // End Camera Transform

      // Text Overlay (Fixed to screen)
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 6;
      ctx.font = '900 italic 40px monospace';
      ctx.textAlign = 'center';
      
      let text = "";
      if (elapsed < 3) text = "A PEACEFUL RIDE...";
      else if (elapsed < 5) text = "MIDAIR SWAP!";
      else if (elapsed < 7) text = "CHAOS ERUPTS!";
      else if (elapsed < 8) text = "CRITICAL FAILURE!";
      
      if (elapsed < 8) {
          ctx.strokeText(text, CANVAS_WIDTH/2, 80);
          ctx.fillText(text, CANVAS_WIDTH/2, 80);
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => cancelAnimationFrame(frameRef.current);
  }, [onComplete]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        className="shadow-2xl border-4 border-gray-800 rounded-lg bg-gray-900"
      />
      {/* SKIP BUTTON */}
      <button 
        onClick={onComplete}
        className="absolute bottom-8 right-8 px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black text-xl font-black italic rounded-xl border-4 border-black hover:scale-110 transition-transform shadow-[6px_6px_0px_#000] active:translate-y-1 active:shadow-[2px_2px_0px_#000] z-50 flex items-center gap-2"
      >
        <span>SKIP</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

// --- Helpers ---

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeInQuad(x: number): number {
    return x * x;
}

function drawSpeedLines(ctx: CanvasRenderingContext2D, time: number) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    const numLines = 20;
    for(let i=0; i<numLines; i++) {
        const x = (Math.random() * CANVAS_WIDTH * 2) - (time * 1000) % (CANVAS_WIDTH * 2);
        const y = Math.random() * CANVAS_HEIGHT;
        const len = Math.random() * 200 + 50;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}

function drawStars(ctx: CanvasRenderingContext2D, time: number) {
    ctx.fillStyle = '#FFF';
    const numStars = 60;
    for (let i = 0; i < numStars; i++) {
        const speed = (i % 3 + 1) * 50;
        let x = (i * 123 + time * -speed) % CANVAS_WIDTH;
        if (x < 0) x += CANVAS_WIDTH;
        const y = (i * 97) % CANVAS_HEIGHT;
        const size = (i % 2) + 1;
        ctx.globalAlpha = 0.5 + Math.sin(time * 5 + i) * 0.5;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
}

function drawCartoonRocket(ctx: CanvasRenderingContext2D, mainColor: string, darkColor: string, time: number) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;

    // Body
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 70, 30, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // Bottom shading
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.ellipse(0, 10, 50, 15, 0, 0, Math.PI*2);
    ctx.fill();

    // Fins
    ctx.fillStyle = darkColor;
    // Top fin
    ctx.beginPath(); ctx.moveTo(-20, -20); ctx.lineTo(-40, -40); ctx.lineTo(10, -20); ctx.fill(); ctx.stroke();
    // Bottom fin
    ctx.beginPath(); ctx.moveTo(-20, 20); ctx.lineTo(-40, 40); ctx.lineTo(10, 20); ctx.fill(); ctx.stroke();

    // Engine
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.rect(-70, -15, 15, 30); ctx.fill(); ctx.stroke();
    
    // Flame
    const flicker = Math.random() * 10;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-70, -10);
    ctx.lineTo(-100 - flicker, 0);
    ctx.lineTo(-70, 10);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-70, -5);
    ctx.lineTo(-90 - flicker, 0);
    ctx.lineTo(-70, 5);
    ctx.fill();

    // Cockpit Window
    ctx.fillStyle = '#bae6fd'; // Light blue glass
    ctx.beginPath();
    ctx.arc(20, -15, 18, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    // Glint
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(25, -20, 5, 0, Math.PI*2); ctx.fill();
}

function drawCharacterHead(ctx: CanvasRenderingContext2D, type: string, time: number) {
    const bounce = Math.sin(time * 10) * 2;
    ctx.translate(0, bounce);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    if (type === 'MONKEY') {
        // Ears
        ctx.fillStyle = '#d97706';
        ctx.beginPath(); ctx.arc(-18, 0, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(18, 0, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        // Head
        ctx.fillStyle = '#b45309';
        ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        // Face Mask
        ctx.fillStyle = '#fcd34d';
        ctx.beginPath(); ctx.ellipse(0, 2, 16, 14, 0, 0, Math.PI*2); ctx.fill();
        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(-6, -2, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, -2, 2, 0, Math.PI*2); ctx.fill();
    } 
    else if (type === 'TIGER') {
        // Ears
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); 
        ctx.moveTo(-20, -10); ctx.lineTo(-25, -25); ctx.lineTo(-10, -15); ctx.fill(); ctx.stroke();
        ctx.moveTo(20, -10); ctx.lineTo(25, -25); ctx.lineTo(10, -15); ctx.fill(); ctx.stroke();
        
        // Head
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        
        // Stripes
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-5, -10); ctx.lineTo(5, -10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-10, -5); ctx.lineTo(-10, 5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(10, -5); ctx.lineTo(10, 5); ctx.fill();

        // Muzzle
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.ellipse(0, 8, 10, 8, 0, 0, Math.PI*2); ctx.fill();
        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(-8, -2, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -2, 2, 0, Math.PI*2); ctx.fill();
    }
}

function drawFullCharacter(ctx: CanvasRenderingContext2D, type: string, time: number, isJumping: boolean) {
    let limbRot = 0;
    if (isJumping) {
        limbRot = Math.sin(time * 20) * 1; 
    }
    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    if (type === 'PANDA') {
         // --- PANDA (Kung Fu) ---
         // Body (Gi)
         ctx.fillStyle = 'white';
         ctx.beginPath(); ctx.ellipse(0, 10, 15, 20, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Belt
         ctx.fillStyle = 'black'; ctx.fillRect(-15, 18, 30, 5);
         
         // Legs
         ctx.fillStyle = '#111';
         ctx.save(); ctx.translate(-8, 25); ctx.rotate(isJumping ? 0.5 : 0); 
         ctx.beginPath(); ctx.ellipse(0, 0, 6, 10, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();
         
         ctx.save(); ctx.translate(8, 25); ctx.rotate(isJumping ? -0.5 : 0);
         ctx.beginPath(); ctx.ellipse(0, 0, 6, 10, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();

         // Arms
         ctx.fillStyle = '#111';
         ctx.save(); ctx.translate(-12, 5); ctx.rotate(limbRot - 0.5); 
         ctx.beginPath(); ctx.ellipse(0, 10, 5, 12, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();

         ctx.save(); ctx.translate(12, 5); ctx.rotate(-limbRot + 0.5);
         ctx.beginPath(); ctx.ellipse(0, 10, 5, 12, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();

         // Head
         ctx.save();
         ctx.translate(0, -10);
         // Flowing Bandana
         ctx.fillStyle = '#ef4444';
         ctx.beginPath(); ctx.moveTo(-15, -8); 
         ctx.bezierCurveTo(-25, -10, -35, 0 + Math.sin(time*20)*5, -45, -5); 
         ctx.lineTo(-45, -10);
         ctx.fill(); ctx.stroke();

         // Ears
         ctx.fillStyle = '#111';
         ctx.beginPath(); ctx.arc(-12, -8, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         ctx.beginPath(); ctx.arc(12, -8, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Head shape
         ctx.fillStyle = 'white';
         ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Headband
         ctx.fillStyle = '#ef4444';
         ctx.beginPath(); ctx.rect(-15, -10, 30, 5); ctx.fill(); ctx.stroke();
         // Patches
         ctx.fillStyle = '#111';
         ctx.beginPath(); ctx.ellipse(-6, -2, 5, 7, -0.3, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.ellipse(6, -2, 5, 7, 0.3, 0, Math.PI*2); ctx.fill();
         // Eyes
         ctx.fillStyle = 'white';
         ctx.beginPath(); ctx.arc(-6, -3, 2, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.arc(6, -3, 2, 0, Math.PI*2); ctx.fill();
         ctx.restore();

    } else if (type === 'BEAR') {
         // --- BEAR (Cyber) ---
         const bearColor = '#5D4037';
         const lightColor = '#A1887F';
         
         // Body
         ctx.fillStyle = bearColor;
         ctx.beginPath(); ctx.ellipse(0, 10, 16, 22, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Metal Chest
         ctx.fillStyle = '#333'; ctx.fillRect(-10, 5, 20, 15); ctx.strokeRect(-10, 5, 20, 15);
         ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(0, 12, 4, 0, Math.PI*2); ctx.fill();

         // Legs
         ctx.fillStyle = bearColor;
         ctx.save(); ctx.translate(-8, 28); ctx.rotate(isJumping ? 0.5 : 0); 
         ctx.beginPath(); ctx.ellipse(0, 0, 7, 11, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();
         
         ctx.save(); ctx.translate(8, 28); ctx.rotate(isJumping ? -0.5 : 0);
         ctx.beginPath(); ctx.ellipse(0, 0, 7, 11, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();

         // Arms
         ctx.fillStyle = bearColor;
         ctx.save(); ctx.translate(-14, 6); ctx.rotate(limbRot - 0.5); 
         ctx.beginPath(); ctx.ellipse(0, 10, 6, 14, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();

         ctx.save(); ctx.translate(14, 6); ctx.rotate(-limbRot + 0.5);
         ctx.beginPath(); ctx.ellipse(0, 10, 6, 14, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();

         // Head
         ctx.save();
         ctx.translate(0, -12);
         // Ears
         ctx.fillStyle = bearColor;
         ctx.beginPath(); ctx.arc(-12, -8, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         ctx.fillStyle = '#555'; // Metal Ear
         ctx.beginPath(); ctx.arc(12, -8, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Head Shape
         ctx.fillStyle = bearColor;
         ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Metal Jaw
         ctx.fillStyle = '#999';
         ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(10, 4); ctx.lineTo(8, 14); ctx.lineTo(-8, 14); ctx.fill(); ctx.stroke();

         // Eyes
         ctx.fillStyle = 'black';
         ctx.beginPath(); ctx.arc(-6, -4, 2, 0, Math.PI*2); ctx.fill();
         ctx.fillStyle = 'red'; // Cyber Eye
         ctx.beginPath(); ctx.arc(6, -4, 3, 0, Math.PI*2); ctx.fill();
         
         ctx.restore();
    }
}

export default Cutscene;