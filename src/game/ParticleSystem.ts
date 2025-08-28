interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
  alpha: number;
  type: 'explosion' | 'spark';
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private ctx: CanvasRenderingContext2D;

  constructor(context: CanvasRenderingContext2D) {
    this.ctx = context;
  }

  createExplosion(x: number, y: number, color: string, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 3 + 1;
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color,
        size: Math.random() * 3 + 2,
        gravity: 0.1,
        alpha: 1,
        type: 'explosion'
      });
    }
  }

  createSpark(x: number, y: number, color: string, count: number = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20,
        maxLife: 20,
        color,
        size: Math.random() * 2 + 1,
        gravity: 0.05,
        alpha: 1,
        type: 'spark'
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Apply gravity
      particle.vy += particle.gravity;
      
      // Apply air resistance
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      // Update life and alpha
      particle.life--;
      particle.alpha = particle.life / particle.maxLife;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.save();
    
    for (const particle of this.particles) {
      this.ctx.globalAlpha = particle.alpha;
      
      if (particle.type === 'explosion') {
        const gradient = this.ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = particle.size;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x, particle.y);
        this.ctx.lineTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
        this.ctx.stroke();
      }
    }
    
    this.ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}