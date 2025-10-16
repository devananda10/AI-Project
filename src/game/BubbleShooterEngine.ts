import { AStarPathfinder } from './AStarPathfinder';
import { ParticleSystem } from './ParticleSystem';

export interface GameStats {
  score: number;
  level: number;
  bubblesLeft: number;
  shots: number;
  astarCalculations: number;
  pathLength: number;
  accuracy: number;
}

export interface GameCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onGameStateChange: (state: any) => void;
}

export interface Bubble {
  x: number;
  y: number;
  color: string;
  radius: number;
  row?: number;
  col?: number;
}

export class BubbleShooterEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private callbacks: GameCallbacks;
 
  private bubbleRadius = 20;
  private bubbleGrid: (Bubble | null)[][] = [];
  private gridRows = 12;
  private gridCols = 20;
  private colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
 
  private currentBubble: Bubble | null = null;
  private nextBubble: Bubble | null = null;
  private shooterX = 0;
  private shooterY = 0;
 
  private aiMode = false;
  private showPath = true;
  private isPaused = false;
  private gameOver = false;
 
  private stats: GameStats = {
    score: 0,
    level: 1,
    bubblesLeft: 0,
    shots: 0,
    astarCalculations: 0,
    pathLength: 0,
    accuracy: 100
  };
 
  private pathfinder: AStarPathfinder;
  private particleSystem: ParticleSystem;
  private currentPath: any[] = [];
 
  private animationFrame: number | null = null;
  private lastTime = 0;
 
  private shootingBubble: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    active: boolean;
  } | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.callbacks = callbacks;
   
    this.shooterX = this.width / 2;
    this.shooterY = this.height - 40;
   
    this.pathfinder = new AStarPathfinder();
    this.particleSystem = new ParticleSystem(this.ctx);
   
    this.initializeGame();
    this.startGameLoop();
  }
 
  private initializeGame() {
    // Initialize bubble grid
    this.bubbleGrid = Array(this.gridRows).fill(null).map(() => Array(this.gridCols).fill(null));
   
    // Create initial bubble formation
    this.createLevel();
   
    // Create current and next bubbles
    this.currentBubble = this.createRandomBubble();
    this.nextBubble = this.createRandomBubble();
   
    this.updateStats();
    this.calculateAIPath();
  }
 
  private createLevel() {
    const levelRows = Math.min(6 + this.stats.level, this.gridRows - 2);
   
    for (let row = 0; row < levelRows; row++) {
      const colsInRow = this.gridCols - (row % 2);
      for (let col = 0; col < colsInRow; col++) {
        if (Math.random() < 0.8) { // 80% chance of bubble
          const x = col * (this.bubbleRadius * 2) + (row % 2) * this.bubbleRadius + this.bubbleRadius;
          const y = row * (this.bubbleRadius * 1.7) + this.bubbleRadius;
         
          this.bubbleGrid[row][col] = {
            x,
            y,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            radius: this.bubbleRadius,
            row,
            col
          };
        }
      }
    }
   
    this.countBubblesLeft();
  }
 
  private createRandomBubble(): Bubble {
    return {
      x: this.shooterX,
      y: this.shooterY,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      radius: this.bubbleRadius
    };
  }
 
  private countBubblesLeft() {
    let count = 0;
    let maxRow = 0;
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (this.bubbleGrid[row][col]) {
            count++;
            if (row > maxRow) {
                maxRow = row;
            }
        }
      }
    }
    this.stats.bubblesLeft = count;
   
    if (count === 0 || maxRow >= this.gridRows -1) {
      this.gameOver = true;
      this.callbacks.onGameStateChange({ gameOver: true });
    }
  }
 
  private calculateAIPath() {
    if (!this.currentBubble) return;
   
    this.stats.astarCalculations++;
   
    // Find best target position using A*
    const targets = this.findPotentialTargets();
    let bestPath: any[] = [];
    let bestScore = -1;
   
    for (const target of targets) {
      const path = this.pathfinder.findPath(
        { x: this.shooterX, y: this.shooterY },
        target,
        this.getBubbleObstacles(),
        {
          canvasWidth: this.width,
          canvasHeight: this.height,
          bubbleRadius: this.bubbleRadius
        }
      );
     
      if (path.length > 0) {
        const score = this.evaluateTarget(target);
        if (score > bestScore) {
          bestScore = score;
          bestPath = path;
        }
      }
    }
   
    this.currentPath = bestPath;
    this.stats.pathLength = bestPath.length;
    this.updateStats();
  }
 
  private findPotentialTargets(): any[] {
    const targets: any[] = [];
   
    if (!this.currentBubble) return targets;
   
    // Find bubbles of the same color
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const bubble = this.bubbleGrid[row][col];
        if (bubble && bubble.color === this.currentBubble.color) {
          // Add adjacent empty positions as targets
          const adjacent = this.getAdjacentPositions(row, col);
          for (const pos of adjacent) {
            if (!this.bubbleGrid[pos.row][pos.col]) {
              const x = pos.col * (this.bubbleRadius * 2) + (pos.row % 2) * this.bubbleRadius + this.bubbleRadius;
              const y = pos.row * (this.bubbleRadius * 1.7) + this.bubbleRadius;
              targets.push({ x, y, row: pos.row, col: pos.col });
            }
          }
        }
      }
    }
   
    return targets;
  }
 
  private getAdjacentPositions(row: number, col: number): { row: number; col: number }[] {
    const adjacent: { row: number; col: number }[] = [];
    const isEvenRow = row % 2 === 0;
   
    const offsets = isEvenRow
      ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
      : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
   
    for (const [dr, dc] of offsets) {
      const newRow = row + dr;
      const newCol = col + dc;
     
      if (newRow >= 0 && newRow < this.gridRows &&
          newCol >= 0 && newCol < this.gridCols) {
        adjacent.push({ row: newRow, col: newCol });
      }
    }
   
    return adjacent;
  }
 
  private evaluateTarget(target: any): number {
    // Score based on potential matches and chain reactions
    let score = 0;
   
    // Check how many same-color bubbles are adjacent
    const adjacent = this.getAdjacentPositions(target.row, target.col);
    let sameColorCount = 0;
   
    for (const pos of adjacent) {
      const bubble = this.bubbleGrid[pos.row][pos.col];
      if (bubble && bubble.color === this.currentBubble?.color) {
        sameColorCount++;
      }
    }
   
    score += sameColorCount * 100;
   
    // Bonus for creating larger groups
    if (sameColorCount >= 2) score += 500;
    if (sameColorCount >= 3) score += 1000;
   
    return score;
  }
 
  private getBubbleObstacles(): any[] {
    const obstacles: any[] = [];
   
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const bubble = this.bubbleGrid[row][col];
        if (bubble) {
          obstacles.push({
            x: bubble.x,
            y: bubble.y,
            radius: bubble.radius
          });
        }
      }
    }
   
    return obstacles;
  }
 
  public shoot() {
    if (!this.currentBubble || this.shootingBubble?.active || this.isPaused) return;
   
    this.stats.shots++;
   
    let targetX = this.width / 2;
    let targetY = this.height / 4;
   
    if (this.aiMode && this.currentPath.length > 1) {
      targetX = this.currentPath[1].x;
      targetY = this.currentPath[1].y;
    }
   
    const dx = targetX - this.shooterX;
    const dy = targetY - this.shooterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 15;
   
    this.shootingBubble = {
      x: this.shooterX,
      y: this.shooterY,
      vx: (dx / distance) * speed,
      vy: (dy / distance) * speed,
      color: this.currentBubble.color,
      active: true
    };
   
    // Create shooting particles
    this.particleSystem.createExplosion(this.shooterX, this.shooterY, this.currentBubble.color, 8);
  }
 
  private updateShootingBubble() {
    if (!this.shootingBubble?.active) return;
   
    // Update position
    this.shootingBubble.x += this.shootingBubble.vx;
    this.shootingBubble.y += this.shootingBubble.vy;
   
    // Wall bounces
    if (this.shootingBubble.x <= this.bubbleRadius ||
        this.shootingBubble.x >= this.width - this.bubbleRadius) {
      this.shootingBubble.vx *= -1;
      this.shootingBubble.x = Math.max(this.bubbleRadius,
        Math.min(this.width - this.bubbleRadius, this.shootingBubble.x));
      this.particleSystem.createSpark(this.shootingBubble.x, this.shootingBubble.y, '#ffffff', 5);
    }
   
    // Check collision with bubbles
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const bubble = this.bubbleGrid[row][col];
        if (bubble) {
          const dx = this.shootingBubble.x - bubble.x;
          const dy = this.shootingBubble.y - bubble.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
         
          if (distance < this.bubbleRadius * 2) {
            this.handleBubbleCollision(row, col);
            return;
          }
        }
      }
    }
   
    // Check if reached top
    if (this.shootingBubble.y <= this.bubbleRadius) {
      this.handleTopCollision();
    }
  }
 
  private handleBubbleCollision(hitRow: number, hitCol: number) {
    if (!this.shootingBubble || !this.currentBubble) return;
   
    // Find empty adjacent position
    const adjacent = this.getAdjacentPositions(hitRow, hitCol);
    let targetPos = null;
   
    for (const pos of adjacent) {
      if (!this.bubbleGrid[pos.row][pos.col]) {
        targetPos = pos;
        break;
      }
    }
   
    if (targetPos) {
      // Place bubble
      const x = targetPos.col * (this.bubbleRadius * 2) + (targetPos.row % 2) * this.bubbleRadius + this.bubbleRadius;
      const y = targetPos.row * (this.bubbleRadius * 1.7) + this.bubbleRadius;
     
      this.bubbleGrid[targetPos.row][targetPos.col] = {
        x,
        y,
        color: this.shootingBubble.color,
        radius: this.bubbleRadius,
        row: targetPos.row,
        col: targetPos.col
      };
     
      // Create placement effect
      this.particleSystem.createExplosion(x, y, this.shootingBubble.color, 12);
     
      // Check for matches
      this.checkMatches(targetPos.row, targetPos.col);
    }
   
    this.finishShot();
  }
 
  private handleTopCollision() {
    if (!this.shootingBubble) return;
   
    // Find closest column
    const col = Math.round((this.shootingBubble.x - this.bubbleRadius) / (this.bubbleRadius * 2));
    const clampedCol = Math.max(0, Math.min(this.gridCols - 1, col));
   
    // Place at top row
    if (!this.bubbleGrid[0][clampedCol]) {
      const x = clampedCol * (this.bubbleRadius * 2) + this.bubbleRadius;
      const y = this.bubbleRadius;
     
      this.bubbleGrid[0][clampedCol] = {
        x,
        y,
        color: this.shootingBubble.color,
        radius: this.bubbleRadius,
        row: 0,
        col: clampedCol
      };
     
      this.particleSystem.createExplosion(x, y, this.shootingBubble.color, 12);
      this.checkMatches(0, clampedCol);
    }
   
    this.finishShot();
  }
 
  private checkMatches(row: number, col: number) {
    const bubble = this.bubbleGrid[row][col];
    if (!bubble) return;
   
    const matches = this.findConnectedBubbles(row, col, bubble.color);
   
    if (matches.length >= 3) {
      // Remove matched bubbles
      let points = matches.length * 100;
     
      for (const match of matches) {
        this.bubbleGrid[match.row][match.col] = null;
        this.particleSystem.createExplosion(match.x, match.y, match.color, 15);
      }
     
      // Check for floating bubbles
      const floating = this.findFloatingBubbles();
      points += floating.length * 50;
     
      for (const floater of floating) {
        this.bubbleGrid[floater.row][floater.col] = null;
        this.particleSystem.createExplosion(floater.x, floater.y, floater.color, 10);
      }
     
      this.stats.score += points;
      this.countBubblesLeft();
    }
  }
 
  private findConnectedBubbles(startRow: number, startCol: number, color: string): any[] {
    const visited = new Set<string>();
    const matches: any[] = [];
    const queue = [{ row: startRow, col: startCol }];
   
    while (queue.length > 0) {
      const { row, col } = queue.shift()!;
      const key = `${row},${col}`;
     
      if (visited.has(key)) continue;
      visited.add(key);
     
      const bubble = this.bubbleGrid[row][col];
      if (!bubble || bubble.color !== color) continue;
     
      matches.push({ ...bubble, row, col });
     
      // Add adjacent bubbles to queue
      const adjacent = this.getAdjacentPositions(row, col);
      for (const pos of adjacent) {
        if (!visited.has(`${pos.row},${pos.col}`)) {
          queue.push(pos);
        }
      }
    }
   
    return matches;
  }
 
  private findFloatingBubbles(): any[] {
    const connected = new Set<string>();
   
    // Mark all bubbles connected to top row
    for (let col = 0; col < this.gridCols; col++) {
      if (this.bubbleGrid[0][col]) {
        this.markConnected(0, col, connected);
      }
    }
   
    // Find floating bubbles
    const floating: any[] = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const bubble = this.bubbleGrid[row][col];
        if (bubble && !connected.has(`${row},${col}`)) {
          floating.push({ ...bubble, row, col });
        }
      }
    }
   
    return floating;
  }
 
  private markConnected(row: number, col: number, connected: Set<string>) {
    const key = `${row},${col}`;
    if (connected.has(key) || !this.bubbleGrid[row][col]) return;
   
    connected.add(key);
   
    const adjacent = this.getAdjacentPositions(row, col);
    for (const pos of adjacent) {
      this.markConnected(pos.row, pos.col, connected);
    }
  }
 
  private finishShot() {
    this.shootingBubble = null;
   
    // Move to next bubble
    this.currentBubble = this.nextBubble;
    this.nextBubble = this.createRandomBubble();
   
    // Calculate accuracy
    this.stats.accuracy = Math.round((this.stats.score / Math.max(1, this.stats.shots * 100)) * 100);
   
    this.updateStats();
    this.calculateAIPath();
  }
 
  private updateStats() {
    this.callbacks.onStatsUpdate(this.stats);
  }
 
  private draw(time: number) {
    // Clear canvas
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.5, '#003366');
    gradient.addColorStop(1, '#001122');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
   
    // Draw AI path
    if (this.showPath && this.currentPath.length > 1) {
      this.drawPath();
    }
   
    // Draw bubble grid
    this.drawBubbleGrid();
   
    // Draw shooting bubble
    if (this.shootingBubble?.active) {
      this.drawBubble(this.shootingBubble.x, this.shootingBubble.y, this.shootingBubble.color);
    }
   
    // Draw shooter
    this.drawShooter();
   
    // Draw current and next bubbles
    if (this.currentBubble) {
      this.drawBubble(this.shooterX, this.shooterY, this.currentBubble.color);
    }
   
    if (this.nextBubble) {
      this.drawBubble(this.width - 60, this.height - 60, this.nextBubble.color, 15);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Next', this.width - 60, this.height - 25);
    }
   
    // Draw particles
    this.particleSystem.update();
    this.particleSystem.draw();
  }
 
  private drawPath() {
    if (this.currentPath.length < 2) return;
   
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([10, 5]);
    this.ctx.lineCap = 'round';
   
    this.ctx.beginPath();
    this.ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y);
   
    for (let i = 1; i < this.currentPath.length; i++) {
      this.ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
    }
    this.ctx.stroke();
    this.ctx.setLineDash([]);
   
    // Draw path points
    this.ctx.fillStyle = '#333';
    for (const point of this.currentPath) {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
 
  private drawBubbleGrid() {
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const bubble = this.bubbleGrid[row][col];
        if (bubble) {
          this.drawBubble(bubble.x, bubble.y, bubble.color);
        }
      }
    }
  }
 
  private drawBubble(x: number, y: number, color: string, radius = this.bubbleRadius) {
    // Create radial gradient
    const gradient = this.ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, 0,
      x, y, radius
    );
    gradient.addColorStop(0, this.lightenColor(color, 40));
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, this.darkenColor(color, 20));
   
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
   
    // Add shine effect
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
    this.ctx.fill();
   
    // Add border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
 
  private drawShooter() {
    // Draw shooter base
    this.ctx.fillStyle = '#333333';
    this.ctx.beginPath();
    this.ctx.arc(this.shooterX, this.shooterY, this.bubbleRadius + 5, 0, Math.PI * 2);
    this.ctx.fill();
   
    // Draw aiming line
    if (this.currentPath.length > 1) {
      const target = this.currentPath[1];
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.shooterX, this.shooterY);
      this.ctx.lineTo(target.x, target.y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }
 
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
 
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  }
 
  private startGameLoop() {
    const gameLoop = (time: number) => {
      if (!this.isPaused) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
       
        this.updateShootingBubble();
       
        // Auto-shoot in AI mode
        if (this.aiMode && !this.shootingBubble?.active) {
          setTimeout(() => this.shoot(), 1000);
        }
       
        this.draw(time);
      }
     
      this.animationFrame = requestAnimationFrame(gameLoop);
    };
   
    this.animationFrame = requestAnimationFrame(gameLoop);
  }
 
  public handleClick(x: number, y: number) {
    if (!this.aiMode && !this.shootingBubble?.active) {
      // Manual aiming - calculate trajectory to click point
      const dx = x - this.shooterX;
      const dy = y - this.shooterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = 15;
     
      this.shootingBubble = {
        x: this.shooterX,
        y: this.shooterY,
        vx: (dx / distance) * speed,
        vy: (dy / distance) * speed,
        color: this.currentBubble?.color || '#ff6b6b',
        active: true
      };
     
      this.stats.shots++;
      this.particleSystem.createExplosion(this.shooterX, this.shooterY, this.currentBubble?.color || '#ff6b6b', 8);
    }
  }
 
  public toggleAI(enabled: boolean) {
    this.aiMode = enabled;
  }
 
  public togglePathVisibility(show: boolean) {
    this.showPath = show;
  }
 
  public togglePause(paused: boolean) {
    this.isPaused = paused;
  }
 
  public resetGame() {
    this.stats = {
      score: 0,
      level: 1,
      bubblesLeft: 0,
      shots: 0,
      astarCalculations: 0,
      pathLength: 0,
      accuracy: 100
    };
   
    this.gameOver = false;
    this.shootingBubble = null;
    this.initializeGame();
  }
 
  public nextLevel() {
    this.stats.level++;
    this.gameOver = false;
    this.shootingBubble = null;
    this.createLevel();
    this.calculateAIPath();
    this.callbacks.onGameStateChange({ gameOver: false });
  }
 
  public destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
