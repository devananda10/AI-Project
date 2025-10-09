import { AStarPathfinder, PathNode } from './AStarPathfinder';
import { ParticleSystem } from './ParticleSystem';

export interface GameStats {
  score: number;
  level: number;
  shotsUntilDrop: number;
  shots: number;
  accuracy: number;
}

export interface GameCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onGameStateChange: (state: GameState) => void;
}

export interface Bubble {
  x: number;
  y: number;
  color: string;
  radius: number;
  row: number;
  col: number;
  isPopping?: boolean;
}

export type GameStatus = 'playing' | 'levelComplete' | 'gameOver';

export interface GameState {
  status: GameStatus;
}

export class BubbleShooterEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private callbacks: GameCallbacks;
  
  private bubbleRadius = 20;
  private bubbleGrid: (Bubble | null)[][] = [];
  private gridRows = 15;
  private gridCols = 20;
  private colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
  
  private currentBubble!: Bubble;
  private nextBubble!: Bubble;
  private shooterX: number;
  private shooterY: number;

  private shotsUntilDrop = 5;
  
  private aiMode = true;
  private showPath = true;
  private isPaused = false;
  
  private gameState: GameState = { status: 'playing' };

  private stats: GameStats = {
    score: 0,
    level: 1,
    shots: 0,
    shotsUntilDrop: this.shotsUntilDrop,
    accuracy: 100
  };
  
  private pathfinder: AStarPathfinder;
  private particleSystem: ParticleSystem;
  private currentAIPath: PathNode[] = [];
  
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

  private readonly BUBBLE_SPACING_X = this.bubbleRadius * 2;
  private readonly BUBBLE_SPACING_Y = this.bubbleRadius * 1.73; // Close to sqrt(3) * radius
  private readonly SHOOTING_SPEED = 18;

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
    this.gameState = { status: 'playing' };
    this.stats.shotsUntilDrop = this.shotsUntilDrop;
    this.bubbleGrid = Array(this.gridRows).fill(null).map(() => Array(this.gridCols).fill(null));
    
    this.createLevel();
    this.spawnNewBubbles();
    this.updateStats();
    this.calculateAIPath();
    this.callbacks.onGameStateChange(this.gameState);
  }
  
  private createLevel() {
    const levelRows = Math.min(5 + this.stats.level, this.gridRows - 5);
    for (let row = 0; row < levelRows; row++) {
      for (let col = 0; col < this.getColsInRow(row); col++) {
        if (Math.random() < 0.75) {
          this.addBubble(row, col, this.getRandomColor());
        }
      }
    }
  }

  private addBubble(row: number, col: number, color: string): Bubble {
    const { x, y } = this.gridToPixel(row, col);
    const newBubble: Bubble = {
      x,
      y,
      color,
      radius: this.bubbleRadius,
      row,
      col
    };
    this.bubbleGrid[row][col] = newBubble;
    return newBubble;
  }

  private getRandomColor(): string {
    const availableColors = this.getColorsOnScreen();
    if (availableColors.size === 0) {
      return this.colors[Math.floor(Math.random() * this.colors.length)];
    }
    const colorsArr = Array.from(availableColors);
    return colorsArr[Math.floor(Math.random() * colorsArr.length)];
  }

  private getColorsOnScreen(): Set<string> {
    const colorSet = new Set<string>();
    for (const row of this.bubbleGrid) {
      for (const bubble of row) {
        if (bubble) colorSet.add(bubble.color);
      }
    }
    return colorSet;
  }
  
  private spawnNewBubbles() {
    this.currentBubble = this.createRandomBubble(this.shooterX, this.shooterY);
    this.nextBubble = this.createRandomBubble(this.width - 60, this.height - 60);
    // Ensure the current bubble color is on the screen
    if (this.getColorsOnScreen().size > 0 && !this.getColorsOnScreen().has(this.currentBubble.color)) {
        this.currentBubble.color = this.getRandomColor();
    }
  }

  private createRandomBubble(x: number, y: number): Bubble {
    return {
      x,
      y,
      color: this.getRandomColor(),
      radius: this.bubbleRadius,
      row: -1, // Not in grid
      col: -1
    };
  }
  
  public shoot(targetX?: number, targetY?: number) {
    if (!this.currentBubble || this.shootingBubble?.active || this.isPaused || this.gameState.status !== 'playing') return;

    this.stats.shots++;
    this.stats.shotsUntilDrop--;
    
    let finalTargetX = targetX;
    let finalTargetY = targetY;

    if (this.aiMode && this.currentAIPath.length > 1) {
      const aimNode = this.currentAIPath.length > 2 ? this.currentAIPath[1] : this.currentAIPath[this.currentAIPath.length - 1];
      finalTargetX = aimNode.x;
      finalTargetY = aimNode.y;
    } else if (targetX === undefined || targetY === undefined) {
      return; // Manual mode requires a target
    }

    if (finalTargetX === undefined || finalTargetY === undefined) return;
    
    const dx = finalTargetX - this.shooterX;
    const dy = finalTargetY - this.shooterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    this.shootingBubble = {
      x: this.shooterX,
      y: this.shooterY,
      vx: (dx / distance) * this.SHOOTING_SPEED,
      vy: (dy / distance) * this.SHOOTING_SPEED,
      color: this.currentBubble.color,
      active: true
    };
    
    this.particleSystem.createExplosion(this.shooterX, this.shooterY, this.currentBubble.color, 8);
  }
  
  private updateShootingBubble() {
    if (!this.shootingBubble?.active) return;
    
    this.shootingBubble.x += this.shootingBubble.vx;
    this.shootingBubble.y += this.shootingBubble.vy;
    
    // Wall bounces
    if (this.shootingBubble.x <= this.bubbleRadius || this.shootingBubble.x >= this.width - this.bubbleRadius) {
      this.shootingBubble.vx *= -1;
      this.shootingBubble.x = Math.max(this.bubbleRadius + 1, Math.min(this.width - this.bubbleRadius - 1, this.shootingBubble.x));
    }
    
    // Check collision with grid bubbles
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.getColsInRow(row); col++) {
        const bubble = this.bubbleGrid[row][col];
        if (bubble) {
          const dx = this.shootingBubble.x - bubble.x;
          const dy = this.shootingBubble.y - bubble.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < this.bubbleRadius * 2) {
            this.handleBubbleCollision(this.shootingBubble);
            return;
          }
        }
      }
    }
    
    // Top wall collision
    if (this.shootingBubble.y <= this.bubbleRadius) {
      this.handleBubbleCollision(this.shootingBubble);
    }
  }

  private handleBubbleCollision(shotBubble: {x: number, y: number, color: string}) {
    const { row, col } = this.pixelToGrid(shotBubble.x, shotBubble.y);

    // Find the closest valid empty slot
    const candidates = [{row, col}, ...this.getAdjacentGridCoords(row, col)]
        .filter(pos => 
            this.isValidGridPos(pos.row, pos.col) && !this.bubbleGrid[pos.row][pos.col]
        );

    if (candidates.length === 0) {
        // Fallback if no empty slot is found (should be rare)
        this.finishShot();
        return;
    }

    let bestCandidate = candidates[0];
    let minDistance = Infinity;

    for(const candidate of candidates) {
        const pixelPos = this.gridToPixel(candidate.row, candidate.col);
        const dist = this.distance(pixelPos, shotBubble);
        if (dist < minDistance) {
            minDistance = dist;
            bestCandidate = candidate;
        }
    }

    const newBubble = this.addBubble(bestCandidate.row, bestCandidate.col, shotBubble.color);
    this.particleSystem.createExplosion(newBubble.x, newBubble.y, newBubble.color, 12);
    
    this.checkMatches(newBubble.row, newBubble.col);
    this.finishShot();
  }
  
  private async checkMatches(row: number, col: number) {
    const bubble = this.bubbleGrid[row][col];
    if (!bubble) return;
    
    const matches = this.findConnectedBubbles(row, col, bubble.color);
    
    if (matches.length >= 3) {
      let points = matches.length * 100 * (this.stats.level);
      
      for (const match of matches) {
          const gridBubble = this.bubbleGrid[match.row][match.col];
          if(gridBubble) {
              gridBubble.isPopping = true;
          }
      }

      await this.sleep(200); // Popping animation delay

      for (const match of matches) {
        this.bubbleGrid[match.row][match.col] = null;
        this.particleSystem.createExplosion(match.x, match.y, match.color, 15);
      }
      
      const floating = this.findFloatingBubbles();
      points += floating.length * 200 * (this.stats.level);
      
      for (const floater of floating) {
        this.bubbleGrid[floater.row][floater.col] = null;
        this.particleSystem.createExplosion(floater.x, floater.y, floater.color, 10);
      }
      
      this.stats.score += points;

      if (this.isLevelClear()) {
          this.gameState.status = 'levelComplete';
          this.callbacks.onGameStateChange(this.gameState);
      }
    }
  }
  
  private findConnectedBubbles(startRow: number, startCol: number, color: string): Bubble[] {
    const visited = new Set<string>();
    const matches: Bubble[] = [];
    const queue = [{ row: startRow, col: startCol }];
    
    while (queue.length > 0) {
      const { row, col } = queue.shift()!;
      const key = `${row},${col}`;
      
      if (!this.isValidGridPos(row, col) || visited.has(key)) continue;
      visited.add(key);
      
      const bubble = this.bubbleGrid[row][col];
      if (!bubble || bubble.color !== color) continue;
      
      matches.push(bubble);
      
      const adjacent = this.getAdjacentGridCoords(row, col);
      queue.push(...adjacent);
    }
    
    return matches;
  }
  
  private findFloatingBubbles(): Bubble[] {
    const connectedToCeiling = new Set<string>();
    
    for (let col = 0; col < this.getColsInRow(0); col++) {
      if (this.bubbleGrid[0][col]) {
        this.markConnected(0, col, connectedToCeiling);
      }
    }
    
    const floating: Bubble[] = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.getColsInRow(row); col++) {
        const bubble = this.bubbleGrid[row][col];
        const key = `${row},${col}`;
        if (bubble && !connectedToCeiling.has(key)) {
          floating.push(bubble);
        }
      }
    }
    
    return floating;
  }
  
  private markConnected(row: number, col: number, connected: Set<string>) {
    const key = `${row},${col}`;
    if (!this.isValidGridPos(row, col) || connected.has(key) || !this.bubbleGrid[row][col]) return;
    
    connected.add(key);
    
    const adjacent = this.getAdjacentGridCoords(row, col);
    for (const pos of adjacent) {
      this.markConnected(pos.row, pos.col, connected);
    }
  }
  
  private finishShot() {
    this.shootingBubble = null;
    
    if (this.stats.shotsUntilDrop <= 0) {
        this.shiftGridDown();
        this.stats.shotsUntilDrop = this.shotsUntilDrop;
    }

    if (this.checkGameOver()) {
        this.gameState.status = 'gameOver';
        this.callbacks.onGameStateChange(this.gameState);
        this.updateStats();
        return;
    }
    
    this.spawnNewBubbles();
    
    this.updateStats();
    this.calculateAIPath();
  }

  private shiftGridDown() {
    for (let row = this.gridRows - 2; row >= 0; row--) {
      for (let col = 0; col < this.getColsInRow(row); col++) {
        if (this.bubbleGrid[row][col]) {
          const bubble = this.bubbleGrid[row][col]!;
          const newRow = row + 1;
          this.bubbleGrid[newRow][col] = bubble;
          bubble.row = newRow;
          const { x, y } = this.gridToPixel(newRow, col);
          bubble.x = x;
          bubble.y = y;
          this.bubbleGrid[row][col] = null;
        }
      }
    }
    // Add new row at the top
    const topRow = 0;
    for (let col = 0; col < this.getColsInRow(topRow); col++) {
       if(Math.random() < 0.75) {
         this.addBubble(topRow, col, this.colors[Math.floor(Math.random() * this.colors.length)]);
       }
    }
  }

  private checkGameOver(): boolean {
    const lastRow = this.gridRows - 1;
    for (let col = 0; col < this.getColsInRow(lastRow); col++) {
        if (this.bubbleGrid[lastRow][col]) {
            return true;
        }
    }
    return false;
  }

  private isLevelClear(): boolean {
    for(const row of this.bubbleGrid) {
        for(const bubble of row) {
            if (bubble) return false;
        }
    }
    return true;
  }
  
  private updateStats() {
    this.callbacks.onStatsUpdate(this.stats);
  }
  
  private draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.5, '#003366');
    gradient.addColorStop(1, '#001122');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.drawAimingLine();

    if (this.showPath && this.currentAIPath.length > 1) {
      this.drawPath(this.currentAIPath);
    }
    
    this.drawBubbleGrid();
    
    if (this.shootingBubble?.active) {
      this.drawBubble(this.shootingBubble.x, this.shootingBubble.y, this.shootingBubble.color);
    }
    
    this.drawShooter();
    this.drawBubble(this.currentBubble.x, this.currentBubble.y, this.currentBubble.color);
    this.drawBubble(this.nextBubble.x, this.nextBubble.y, this.nextBubble.color, this.bubbleRadius * 0.8);
    
    this.particleSystem.update();
    this.particleSystem.draw();
  }
  
  private drawPath(path: PathNode[]) {
    if (path.length < 2) return;
    
    this.ctx.strokeStyle = '#38bdf8'; // Light blue for AI path
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([8, 8]);
    this.ctx.lineCap = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      this.ctx.lineTo(path[i].x, path[i].y);
    }
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawAimingLine() {
    const mouse = {x: 0, y: 0}; // You would get this from mouse move events
    // This is a placeholder. A real implementation needs mouse input.
    // For now, let's draw a default line.
    const angle = -Math.PI / 2;
    let x = this.shooterX;
    let y = this.shooterY;
    let vx = Math.cos(angle) * this.SHOOTING_SPEED;
    let vy = Math.sin(angle) * this.SHOOTING_SPEED;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([2, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);

    for (let i = 0; i < 100; i++) {
        x += vx;
        y += vy;
        if (x < this.bubbleRadius || x > this.width - this.bubbleRadius) {
            vx *= -1;
        }
        if (y < this.bubbleRadius) {
            break;
        }
        const {row, col} = this.pixelToGrid(x, y);
        if (this.isValidGridPos(row, col) && this.bubbleGrid[row][col]) {
            break;
        }
        this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
  
  private drawBubbleGrid() {
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.getColsInRow(row); col++) {
        const bubble = this.bubbleGrid[row][col];
        if (bubble) {
          this.drawBubble(bubble.x, bubble.y, bubble.color);
          if (bubble.isPopping) {
              // Add a popping effect
              this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
              this.ctx.beginPath();
              this.ctx.arc(bubble.x, bubble.y, bubble.radius * 1.2, 0, Math.PI * 2);
              this.ctx.fill();
          }
        }
      }
    }
  }
  
  private drawBubble(x: number, y: number, color: string, radius = this.bubbleRadius) {
    const gradient = this.ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, this.lightenColor(color, 40));
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, this.darkenColor(color, 20));
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  private drawShooter() {
    this.ctx.fillStyle = '#333333';
    this.ctx.beginPath();
    this.ctx.arc(this.shooterX, this.shooterY, this.bubbleRadius + 5, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  private gameLoop(time: number) {
    if (!this.isPaused) {
      this.updateShootingBubble();
      if (this.aiMode && !this.shootingBubble?.active && this.gameState.status === 'playing') {
          setTimeout(() => this.shoot(), 500);
      }
      this.draw();
    }
    
    this.animationFrame = requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  private startGameLoop() {
    this.animationFrame = requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  public handleClick(x: number, y: number) {
    if (this.gameState.status !== 'playing') return;
    this.shoot(x, y);
  }
  
  public toggleAI(enabled: boolean) { this.aiMode = enabled; }
  public togglePathVisibility(show: boolean) { this.showPath = show; }
  public togglePause(paused: boolean) { this.isPaused = paused; }
  
  public resetGame() {
    this.stats.score = 0;
    this.stats.level = 1;
    this.stats.shots = 0;
    this.initializeGame();
  }
  
  public nextLevel() {
    this.stats.level++;
    this.stats.shots = 0;
    this.initializeGame();
  }

  // --- Utility and Coordinate Functions ---
  
  private getColsInRow(row: number): number {
    return this.gridCols - (row % 2);
  }

  private isValidGridPos(row: number, col: number): boolean {
    return row >= 0 && row < this.gridRows && col >= 0 && col < this.getColsInRow(row);
  }

  private gridToPixel(row: number, col: number): { x: number, y: number } {
    const x = col * this.BUBBLE_SPACING_X + (row % 2) * this.bubbleRadius + this.bubbleRadius;
    const y = row * this.BUBBLE_SPACING_Y + this.bubbleRadius;
    return { x, y };
  }

  private pixelToGrid(x: number, y: number): { row: number, col: number } {
    const row = Math.round((y - this.bubbleRadius) / this.BUBBLE_SPACING_Y);
    const colOffset = (row % 2) * this.bubbleRadius;
    const col = Math.round((x - colOffset - this.bubbleRadius) / this.BUBBLE_SPACING_X);
    return { row, col };
  }

  private getAdjacentGridCoords(row: number, col: number): { row: number; col: number }[] {
    const isEvenRow = row % 2 === 0;
    const offsets = isEvenRow 
      ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
      : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
    
    return offsets.map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
                  .filter(pos => this.isValidGridPos(pos.row, pos.col));
  }

  private calculateAIPath() {
    if (!this.currentBubble || this.gameState.status !== 'playing') return;
    // Basic AI: Find first available spot for a match
    const potentialTargets: any[] = [];
    for (let r = 0; r < this.gridRows; r++) {
        for (let c = 0; c < this.getColsInRow(r); c++) {
            if (!this.bubbleGrid[r][c]) {
                const neighbors = this.getAdjacentGridCoords(r, c);
                if (neighbors.some(n => this.bubbleGrid[n.row][n.col]?.color === this.currentBubble.color)) {
                    potentialTargets.push(this.gridToPixel(r, c));
                }
            }
        }
    }
    if (potentialTargets.length > 0) {
        // Just pick the highest one
        potentialTargets.sort((a,b) => a.y - b.y);
        this.currentAIPath = [this.gridToPixel(-1,-1), potentialTargets[0]];
    } else {
        this.currentAIPath = [];
    }
  }

  private distance = (a: any, b: any) => Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
  private sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
  private lightenColor = (c: string, p: number) => this.adjustColor(c, p);
  private darkenColor = (c: string, p: number) => this.adjustColor(c, -p);
  private adjustColor(color: string, percent: number): string {
    let [r, g, b] = color.match(/\w\w/g)!.map((x) => parseInt(x, 16));
    const amount = Math.round(2.55 * percent);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return "#" + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }
  
  public destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
