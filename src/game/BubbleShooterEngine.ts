import { AStarPathfinder, PathNode } from './AStarPathfinder';
import { ParticleSystem } from './ParticleSystem';

// --- Interfaces and Types ---

export interface GameStats {
  score: number;
  level: number;
  shotsUntilDrop: number;
  shots: number;
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

// --- Main Game Engine Class ---

export class BubbleShooterEngine {
  // --- Core Properties ---
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private callbacks: GameCallbacks;

  // --- Game Config ---
  private bubbleRadius = 20;
  private gridRows = 15;
  private gridCols = 20;
  private colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
  private readonly SHOTS_BEFORE_DROP = 5;
  private readonly SHOOTING_SPEED = 20;

  // --- Game State ---
  private bubbleGrid: (Bubble | null)[][] = [];
  private currentBubble!: Bubble;
  private nextBubble!: Bubble;
  private shooterX: number;
  private shooterY: number;
  
  private gameState: GameState = { status: 'playing' };
  private stats: GameStats = { score: 0, level: 1, shots: 0, shotsUntilDrop: this.SHOTS_BEFORE_DROP };
  
  private shootingBubble: { x: number; y: number; vx: number; vy: number; color: string; active: boolean; } | null = null;
  
  // --- AI and Effects ---
  private aiMode = true;
  private showPath = true;
  private pathfinder: AStarPathfinder;
  private particleSystem: ParticleSystem;
  private currentAIPath: PathNode[] = [];
  
  private animationFrame: number | null = null;
  private mousePos = { x: 0, y: 0 };

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
    this.setupEventListeners();
    this.startGameLoop();
  }

  // --- Game Initialization and Level Setup ---

  private initializeGame() {
    this.gameState = { status: 'playing' };
    this.stats = { score: 0, level: 1, shots: 0, shotsUntilDrop: this.SHOTS_BEFORE_DROP };
    this.bubbleGrid = Array(this.gridRows).fill(null).map(() => Array(this.gridCols).fill(null));
    
    this.createLevel();
    this.spawnNewBubbles();
    this.updateStats();
    this.calculateAIPath();
    this.callbacks.onGameStateChange(this.gameState);
  }

  private createLevel() {
    const levelRows = Math.min(4 + this.stats.level, this.gridRows - 7);
    for (let row = 0; row < levelRows; row++) {
      for (let col = 0; col < this.getColsInRow(row); col++) {
        if (Math.random() < 0.8) {
          const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
          this.addBubble(row, col, randomColor);
        }
      }
    }
  }

  private addBubble(row: number, col: number, color: string): Bubble {
    const { x, y } = this.gridToPixel(row, col);
    const newBubble: Bubble = { x, y, color, radius: this.bubbleRadius, row, col };
    this.bubbleGrid[row][col] = newBubble;
    return newBubble;
  }

  private spawnNewBubbles() {
    this.currentBubble = this.createRandomShooterBubble(this.shooterX, this.shooterY);
    this.nextBubble = this.createRandomShooterBubble(this.width - 60, this.height - 60);
  }

  private createRandomShooterBubble(x: number, y: number): Bubble {
    const colorsOnScreen = this.getColorsOnScreen();
    const colorPool = colorsOnScreen.size > 0 ? Array.from(colorsOnScreen) : this.colors;
    const color = colorPool[Math.floor(Math.random() * colorPool.length)];
    return { x, y, color, radius: this.bubbleRadius, row: -1, col: -1 };
  }

  // --- Shooting and Collision Logic ---

  public shoot() {
    if (this.shootingBubble?.active || this.gameState.status !== 'playing') return;

    let targetX = this.mousePos.x;
    let targetY = this.mousePos.y;

    if (this.aiMode && this.currentAIPath.length > 1) {
      const aimNode = this.currentAIPath[this.currentAIPath.length - 1];
      targetX = aimNode.x;
      targetY = aimNode.y;
    }
    
    const dx = targetX - this.shooterX;
    const dy = targetY - this.shooterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    this.shootingBubble = {
      x: this.shooterX, y: this.shooterY,
      vx: (dx / distance) * this.SHOOTING_SPEED,
      vy: (dy / distance) * this.SHOOTING_SPEED,
      color: this.currentBubble.color, active: true
    };

    this.stats.shots++;
    this.stats.shotsUntilDrop--;
    this.particleSystem.createExplosion(this.shooterX, this.shooterY, this.currentBubble.color, 8);
  }

  private updateShootingBubble() {
    if (!this.shootingBubble?.active) return;

    this.shootingBubble.x += this.shootingBubble.vx;
    this.shootingBubble.y += this.shootingBubble.vy;

    if (this.shootingBubble.x <= this.bubbleRadius || this.shootingBubble.x >= this.width - this.bubbleRadius) {
      this.shootingBubble.vx *= -1;
      this.shootingBubble.x = Math.max(this.bubbleRadius, Math.min(this.width - this.bubbleRadius, this.shootingBubble.x));
    }

    if (this.shootingBubble.y <= this.bubbleRadius) {
        this.snapBubbleToGrid(this.shootingBubble);
        return;
    }

    for (const row of this.bubbleGrid) {
      for (const bubble of row) {
        if (bubble && this.distance(bubble, this.shootingBubble) < this.bubbleRadius * 2) {
          // FIX: Backtrack the bubble by one frame to its pre-collision position.
          // This prevents it from visually going "inside" another bubble before snapping.
          this.shootingBubble.x -= this.shootingBubble.vx;
          this.shootingBubble.y -= this.shootingBubble.vy;
          
          this.snapBubbleToGrid(this.shootingBubble);
          return;
        }
      }
    }
  }

  private snapBubbleToGrid(shotBubble: { x: number; y: number; color: string; }) {
    const { row, col } = this.pixelToGrid(shotBubble.x, shotBubble.y);
    
    const candidates = [{row, col}, ...this.getAdjacentGridCoords(row, col)]
      .filter(pos => this.isValidGridPos(pos.row, pos.col) && !this.bubbleGrid[pos.row][pos.col]);

    if (candidates.length === 0) {
      this.finishShot(); // No valid spot, bubble disappears
      return;
    }

    const bestCandidate = candidates.reduce((best, current) => {
        const bestDist = this.distance(this.gridToPixel(best.row, best.col), shotBubble);
        const currentDist = this.distance(this.gridToPixel(current.row, current.col), shotBubble);
        return currentDist < bestDist ? current : best;
    });

    const newBubble = this.addBubble(bestCandidate.row, bestCandidate.col, shotBubble.color);
    this.particleSystem.createExplosion(newBubble.x, newBubble.y, newBubble.color, 12);
    
    this.checkMatches(newBubble.row, newBubble.col);
    this.finishShot();
  }

  // --- Match and Grid Logic ---

  private async checkMatches(row: number, col: number) {
    const bubble = this.bubbleGrid[row][col];
    if (!bubble) return;
    
    const matches = this.findConnectedBubbles(row, col, bubble.color);
    
    if (matches.length >= 3) {
      this.stats.score += matches.length * 100;
      
      matches.forEach(b => { if(b) b.isPopping = true; });
      await this.sleep(150);
      matches.forEach(b => { 
        if(b) {
          this.bubbleGrid[b.row][b.col] = null;
          this.particleSystem.createExplosion(b.x, b.y, b.color, 15);
        }
      });
      
      const floating = this.findFloatingBubbles();
      if(floating.length > 0) {
        await this.sleep(150);
        this.stats.score += floating.length * 200;
        floating.forEach(b => {
          if(b) {
            this.bubbleGrid[b.row][b.col] = null;
            this.particleSystem.createExplosion(b.x, b.y, b.color, 10);
          }
        });
      }

      if (this.isLevelClear()) {
          this.gameState.status = 'levelComplete';
          this.callbacks.onGameStateChange(this.gameState);
      }
    }
  }

  private finishShot() {
    this.shootingBubble = null;

    if (this.stats.shotsUntilDrop <= 0) {
      this.shiftGridDown();
      this.stats.shotsUntilDrop = this.SHOTS_BEFORE_DROP;
    }

    if (this.checkGameOver()) {
      this.gameState.status = 'gameOver';
      this.callbacks.onGameStateChange(this.gameState);
      this.updateStats();
      return;
    }
    
    if (this.gameState.status === 'playing') {
      this.spawnNewBubbles();
      this.updateStats();
      this.calculateAIPath();
    }
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
          bubble.x = x; bubble.y = y;
          this.bubbleGrid[row][col] = null;
        }
      }
    }
    for (let col = 0; col < this.getColsInRow(0); col++) {
       if(Math.random() < 0.8) {
         this.addBubble(0, col, this.colors[Math.floor(Math.random() * this.colors.length)]);
       }
    }
  }

  private checkGameOver(): boolean {
    const lastRow = this.gridRows - 3;
    for (let col = 0; col < this.getColsInRow(lastRow); col++) {
      if (this.bubbleGrid[lastRow][col]) return true;
    }
    return false;
  }
  
  // --- Drawing and Rendering ---

  private draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    this.drawAimingLine();
    if (this.showPath && this.aiMode && this.currentAIPath.length > 1) this.drawPath(this.currentAIPath);
    this.drawBubbleGrid();
    if (this.shootingBubble?.active) this.drawBubble(this.shootingBubble.x, this.shootingBubble.y, this.shootingBubble.color);
    this.drawShooter();
    this.drawBubble(this.currentBubble.x, this.currentBubble.y, this.currentBubble.color);
    this.drawBubble(this.nextBubble.x, this.nextBubble.y, this.nextBubble.color, 0.8);
    this.particleSystem.update();
    this.particleSystem.draw();
  }

  private drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#020024');
    gradient.addColorStop(0.7, '#090979');
    gradient.addColorStop(1, '#00d4ff');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawAimingLine() {
    const angle = Math.atan2(this.mousePos.y - this.shooterY, this.mousePos.x - this.shooterX);
    if(this.mousePos.y > this.shooterY - 20) return;

    let pos = { x: this.shooterX, y: this.shooterY };
    let dir = { x: Math.cos(angle), y: Math.sin(angle) };

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 8]);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);

    for (let i = 0; i < 100; i++) {
        pos.x += dir.x * 10;
        pos.y += dir.y * 10;

        if (pos.x < this.bubbleRadius || pos.x > this.width - this.bubbleRadius) {
            dir.x *= -1; // Bounce
        }

        const {row, col} = this.pixelToGrid(pos.x, pos.y);
        if (this.isValidGridPos(row, col) && this.bubbleGrid[row][col]) {
            break;
        }
        if(pos.y < this.bubbleRadius) break;
    }
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawPath(path: PathNode[]) {
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([8, 8]);
    this.ctx.beginPath();
    this.ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) this.ctx.lineTo(path[i].x, path[i].y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawBubbleGrid() {
    this.bubbleGrid.flat().forEach(bubble => {
      if (bubble) {
        this.drawBubble(bubble.x, bubble.y, bubble.color);
        if (bubble.isPopping) {
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          this.ctx.beginPath();
          this.ctx.arc(bubble.x, bubble.y, bubble.radius * (1 + (Math.random() * 0.4)), 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    });
  }

  private drawBubble(x: number, y: number, color: string, scale = 1) {
    const radius = this.bubbleRadius * scale;
    const gradient = this.ctx.createRadialGradient(x - radius * 0.4, y - radius * 0.4, radius * 0.1, x, y, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, this.lightenColor(color, 20));
    gradient.addColorStop(1, color);
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawShooter() {
    this.ctx.fillStyle = '#4a5568';
    this.ctx.beginPath();
    this.ctx.arc(this.shooterX, this.shooterY, this.bubbleRadius + 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#2d3748';
    this.ctx.beginPath();
    this.ctx.arc(this.shooterX, this.shooterY, this.bubbleRadius + 5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // --- Game Loop and Control ---
  private gameLoop() {
    this.updateShootingBubble();
    this.draw();
    this.animationFrame = requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  private startGameLoop() { this.animationFrame = requestAnimationFrame(this.gameLoop.bind(this)); }
  public destroy() { if (this.animationFrame) cancelAnimationFrame(this.animationFrame); }
  public toggleAI(enabled: boolean) { this.aiMode = enabled; }
  public resetGame() { this.initializeGame(); }
  public nextLevel() { this.stats.level++; this.initializeGame(); }

  // --- Event Handling ---
  private setupEventListeners() {
      this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.canvas.addEventListener('click', this.handleMouseClick.bind(this));
  }
  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos.x = e.clientX - rect.left;
    this.mousePos.y = e.clientY - rect.top;
  }
  private handleMouseClick() { if (!this.aiMode) this.shoot(); }

  // --- AI Logic ---
  private calculateAIPath() {
    if (!this.currentBubble) { this.currentAIPath = []; return; }
    
    const obstacles = this.bubbleGrid.flat().filter(b => b !== null) as Bubble[];
    const bestTarget = this.findBestShootingSpot();

    if (bestTarget) {
      this.currentAIPath = this.pathfinder.findPath(
        { x: this.shooterX, y: this.shooterY },
        this.gridToPixel(bestTarget.row, bestTarget.col),
        obstacles,
        { canvasWidth: this.width, canvasHeight: this.height, bubbleRadius: this.bubbleRadius }
      );
    } else {
      this.currentAIPath = [];
    }
  }

  private findBestShootingSpot(): { row: number, col: number, score: number } | null {
    let bestTarget: { row: number, col: number, score: number } | null = null;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.getColsInRow(r); c++) {
        if (!this.bubbleGrid[r][c]) {
          const neighbors = this.getAdjacentGridCoords(r, c).map(p => this.bubbleGrid[p.row][p.col]).filter(b => b !== null);
          if (neighbors.length > 0) {
            const matchCount = neighbors.filter(b => b!.color === this.currentBubble.color).length;
            const score = matchCount * 100 - r * 10; // Prioritize matches higher up
            if (matchCount > 0 && (!bestTarget || score > bestTarget.score)) {
              bestTarget = { row: r, col: c, score };
            }
          }
        }
      }
    }
    return bestTarget;
  }

  // --- Utility Functions ---
  private findConnectedBubbles = (startRow: number, startCol: number, color: string): Bubble[] => {
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
        queue.push(...this.getAdjacentGridCoords(row, col));
    }
    return matches;
  };

  private findFloatingBubbles = (): Bubble[] => {
    const connected = new Set<string>();
    for (let c = 0; c < this.getColsInRow(0); c++) {
      if (this.bubbleGrid[0][c]) this.markConnected(0, c, connected);
    }
    const floating: Bubble[] = [];
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.getColsInRow(r); c++) {
        if (this.bubbleGrid[r][c] && !connected.has(`${r},${c}`)) {
          floating.push(this.bubbleGrid[r][c]!);
        }
      }
    }
    return floating;
  };
  
  private markConnected = (r: number, c: number, connected: Set<string>) => {
    const key = `${r},${c}`;
    if (!this.isValidGridPos(r, c) || connected.has(key) || !this.bubbleGrid[r][c]) return;
    connected.add(key);
    this.getAdjacentGridCoords(r, c).forEach(p => this.markConnected(p.row, p.col, connected));
  };

  private getColorsOnScreen = () => new Set(this.bubbleGrid.flat().filter(b => b).map(b => b!.color));
  private isLevelClear = () => this.bubbleGrid.flat().every(b => b === null);
  private getColsInRow = (row: number) => this.gridCols - (row % 2);
  private isValidGridPos = (r: number, c: number) => r >= 0 && r < this.gridRows && c >= 0 && c < this.getColsInRow(r);
  private gridToPixel = (r: number, c: number) => ({ x: c * (this.bubbleRadius * 2) + (r % 2) * this.bubbleRadius + this.bubbleRadius, y: r * (this.bubbleRadius * 1.73) + this.bubbleRadius });
  private pixelToGrid = (x: number, y: number) => {
    const row = Math.round((y - this.bubbleRadius) / (this.bubbleRadius * 1.73));
    const col = Math.round((x - ((row % 2) * this.bubbleRadius) - this.bubbleRadius) / (this.bubbleRadius * 2));
    return { row, col };
  };
  private getAdjacentGridCoords = (r: number, c: number) => {
    const offsets = (r % 2 === 0) ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]] : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];
    return offsets.map(([dr, dc]) => ({ row: r + dr, col: c + dc })).filter(p => this.isValidGridPos(p.row, p.col));
  };
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
}


