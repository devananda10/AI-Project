export interface PathNode {
  x: number;
  y: number;
  gScore: number;
  hScore: number;
  fScore: number;
  parent?: PathNode;
}

export interface PathfindingOptions {
  canvasWidth: number;
  canvasHeight: number;
  bubbleRadius: number;
}

export class AStarPathfinder {
  private readonly STEP_SIZE = 30;
  private readonly ANGLE_DIVISIONS = 16;

  findPath(
    start: any, 
    goal: any, 
    obstacles: any[], 
    options: PathfindingOptions
  ): PathNode[] {
    const openSet: PathNode[] = [];
    const closedSet: PathNode[] = [];

    const startNode: PathNode = {
      x: start.x,
      y: start.y,
      gScore: 0,
      hScore: this.calculateHeuristic(start, goal),
      fScore: 0,
      parent: undefined
    };
    startNode.fScore = startNode.gScore + startNode.hScore;

    openSet.push(startNode);

    let iterations = 0;
    const maxIterations = 500;

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;

      // Find node with lowest f-score
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].fScore < openSet[currentIndex].fScore) {
          currentIndex = i;
        }
      }

      const current = openSet.splice(currentIndex, 1)[0];
      closedSet.push(current);

      // Check if we've reached the goal
      if (this.distance(current, goal) <= options.bubbleRadius * 2) {
        return this.reconstructPath(current);
      }

      // Generate neighbors
      const neighbors = this.getNeighbors(current, obstacles, options);

      for (const neighbor of neighbors) {
        // Skip if in closed set
        if (this.isInSet(neighbor, closedSet)) continue;

        const tentativeGScore = current.gScore + this.distance(current, neighbor);

        let existingOpenNode = this.findInSet(neighbor, openSet);
        
        if (!existingOpenNode) {
          neighbor.gScore = tentativeGScore;
          neighbor.hScore = this.calculateHeuristic(neighbor, goal);
          neighbor.fScore = neighbor.gScore + neighbor.hScore;
          neighbor.parent = current;
          openSet.push(neighbor);
        } else if (tentativeGScore < existingOpenNode.gScore) {
          existingOpenNode.gScore = tentativeGScore;
          existingOpenNode.fScore = existingOpenNode.gScore + existingOpenNode.hScore;
          existingOpenNode.parent = current;
        }
      }
    }

    // No path found, return direct path
    return [startNode, { ...goal, gScore: 0, hScore: 0, fScore: 0 }];
  }

  private getNeighbors(
    node: PathNode,
    obstacles: any[],
    options: PathfindingOptions
  ): PathNode[] {
    const neighbors: PathNode[] = [];
    
    for (let i = 0; i < this.ANGLE_DIVISIONS; i++) {
      const angle = (i * 2 * Math.PI) / this.ANGLE_DIVISIONS;
      
      let newX = node.x + Math.cos(angle) * this.STEP_SIZE;
      let newY = node.y + Math.sin(angle) * this.STEP_SIZE;

      // Handle wall bounces
      if (newX <= options.bubbleRadius || newX >= options.canvasWidth - options.bubbleRadius) {
        newX = Math.max(options.bubbleRadius, Math.min(options.canvasWidth - options.bubbleRadius, newX));
      }

      if (newY <= options.bubbleRadius) {
        newY = options.bubbleRadius;
      }

      // Check obstacle collision
      const collides = obstacles.some(obstacle => 
        this.distance({ x: newX, y: newY }, obstacle) < obstacle.radius + options.bubbleRadius + 5
      );

      if (!collides && newY < options.canvasHeight - 50) {
        neighbors.push({
          x: newX,
          y: newY,
          gScore: 0,
          hScore: 0,
          fScore: 0,
          parent: undefined
        });
      }
    }

    return neighbors;
  }

  private calculateHeuristic(node: PathNode, goal: any): number {
    return this.distance(node, goal);
  }

  private distance(a: any, b: any): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private reconstructPath(node: PathNode): PathNode[] {
    const path: PathNode[] = [];
    let current: PathNode | undefined = node;

    while (current) {
      path.unshift(current);
      current = current.parent;
    }

    return path;
  }

  private isInSet(node: PathNode, set: PathNode[]): boolean {
    return set.some(setNode => 
      Math.abs(setNode.x - node.x) < 10 && 
      Math.abs(setNode.y - node.y) < 10
    );
  }

  private findInSet(node: PathNode, set: PathNode[]): PathNode | undefined {
    return set.find(setNode => 
      Math.abs(setNode.x - node.x) < 10 && 
      Math.abs(setNode.y - node.y) < 10
    );
  }
}
