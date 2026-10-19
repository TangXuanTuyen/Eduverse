/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CollisionSystem } from './collision';

export interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export class PathfindingSystem {
  private collision: CollisionSystem;

  constructor(collision: CollisionSystem) {
    this.collision = collision;
  }

  /**
   * Finds a path from start to goal.
   * If the goal tile itself is an obstacle (e.g. clicking directly on a building),
   * it automatically targets the closest walkable tile adjacent to the target!
   */
  findPath(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number
  ): { x: number; y: number }[] {
    const sx = Math.floor(startX);
    const sy = Math.floor(startY);
    let gx = Math.floor(targetX);
    let gy = Math.floor(targetY);

    // If starting on non-walkable tile, find closest valid start
    if (!this.collision.isTileWalkable(sx, sy)) {
      return [];
    }

    // If target tile is blocked, look for closest walkable tile surrounding it
    if (!this.collision.isTileWalkable(gx, gy)) {
      let found: { x: number; y: number } | null = null;
      let minDistance = Infinity;

      // Expand search ring around target up to 8 tiles
      for (let r = 1; r <= 8; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            if (Math.abs(dx) === r || Math.abs(dy) === r) {
              const tx = gx + dx;
              const ty = gy + dy;
              if (this.collision.isTileWalkable(tx, ty)) {
                // Heuristic: prefer candidates closest to the start position
                const dist = Math.hypot(tx - sx, ty - sy);
                if (dist < minDistance) {
                  minDistance = dist;
                  found = { x: tx, y: ty };
                }
              }
            }
          }
        }
        if (found) break; // Found walkable neighbor at this layer
      }

      if (!found) {
        return [];
      }
      const targetPos: { x: number; y: number } = found;
      gx = targetPos.x;
      gy = targetPos.y;
    }

    if (sx === gx && sy === gy) {
      return [{ x: gx + 0.5, y: gy + 0.5 }];
    }

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();

    const startNode: PathNode = {
      x: sx,
      y: sy,
      g: 0,
      h: Math.abs(gx - sx) + Math.abs(gy - sy),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    const key = (x: number, y: number) => `${x},${y}`;

    let maxSteps = 1500; // Safeguard against unbounded search

    while (openSet.length > 0 && maxSteps-- > 0) {
      // Find node with lowest f
      let lowestIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIndex].f) {
          lowestIndex = i;
        }
      }

      const current = openSet.splice(lowestIndex, 1)[0];
      closedSet.add(key(current.x, current.y));

      // Reached goal?
      if (current.x === gx && current.y === gy) {
        const path: { x: number; y: number }[] = [];
        let curr: PathNode | null = current;
        while (curr) {
          path.unshift({ x: curr.x + 0.5, y: curr.y + 0.5 });
          curr = curr.parent;
        }
        // Remove start tile to just follow the waypoints
        if (path.length > 1) {
          path.shift();
        }
        return path;
      }

      // Check 4 cardinal neighbors
      const neighbors = [
        { x: current.x, y: current.y - 1 }, // Up
        { x: current.x, y: current.y + 1 }, // Down
        { x: current.x - 1, y: current.y }, // Left
        { x: current.x + 1, y: current.y }, // Right
      ];

      for (const n of neighbors) {
        if (!this.collision.isTileWalkable(n.x, n.y)) continue;
        if (closedSet.has(key(n.x, n.y))) continue;

        const gScore = current.g + 1;
        let existing = openSet.find((node) => node.x === n.x && node.y === n.y);

        if (!existing) {
          const h = Math.abs(gx - n.x) + Math.abs(gy - n.y);
          existing = {
            x: n.x,
            y: n.y,
            g: gScore,
            h,
            f: gScore + h,
            parent: current,
          };
          openSet.push(existing);
        } else if (gScore < existing.g) {
          existing.g = gScore;
          existing.f = gScore + existing.h;
          existing.parent = current;
        }
      }
    }

    return []; // No path found
  }
}
