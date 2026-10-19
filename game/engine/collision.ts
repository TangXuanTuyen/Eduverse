/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RectCollider {
  x: number;
  y: number;
  width: number;
  height: number;
  tag?: string;
}

export class CollisionSystem {
  readonly mapWidth: number;
  readonly mapHeight: number;
  private colliders: RectCollider[] = [];

  constructor(mapWidth = 36, mapHeight = 26) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }

  addCollider(collider: RectCollider) {
    this.colliders.push(collider);
  }

  setColliders(colliders: RectCollider[]) {
    this.colliders = [...colliders];
  }

  getColliders(): RectCollider[] {
    return this.colliders;
  }

  /**
   * Check if tile coordinates (x, y) are inside map boundaries and not inside any obstacle
   */
  isTileWalkable(x: number, y: number): boolean {
    const rx = Math.floor(x);
    const ry = Math.floor(y);

    // Boundary check (1 tile border is impassable)
    if (rx < 1 || rx >= this.mapWidth - 1 || ry < 1 || ry >= this.mapHeight - 1) {
      return false;
    }

    // Check collision against all rectangular obstacles
    for (const c of this.colliders) {
      if (rx >= c.x && rx < c.x + c.width && ry >= c.y && ry < c.y + c.height) {
        return false;
      }
    }

    return true;
  }

  /**
   * Continuous box collision check with radius for smooth player movement
   */
  canMoveTo(newX: number, newY: number, radius = 0.35): boolean {
    // Check multiple sample points around the player's bounding circle
    const samples = [
      { x: newX - radius, y: newY - radius },
      { x: newX + radius, y: newY - radius },
      { x: newX - radius, y: newY + radius },
      { x: newX + radius, y: newY + radius },
    ];

    for (const s of samples) {
      if (!this.isTileWalkable(s.x, s.y)) {
        return false;
      }
    }
    return true;
  }

  /**
   * If a stored position became invalid (inside a building or out of bounds),
   * safely finds the nearest legal walkable tile.
   */
  findNearestSafePosition(startX: number, startY: number): { x: number; y: number } {
    const cx = Math.floor(startX);
    const cy = Math.floor(startY);

    if (this.isTileWalkable(cx, cy)) {
      return { x: cx + 0.5, y: cy + 0.5 };
    }

    // Breadth-first search outwards for the closest walkable tile
    for (let r = 1; r < Math.max(this.mapWidth, this.mapHeight); r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) === r || Math.abs(dy) === r) {
            const tx = cx + dx;
            const ty = cy + dy;
            if (this.isTileWalkable(tx, ty)) {
              return { x: tx + 0.5, y: ty + 0.5 };
            }
          }
        }
      }
    }

    // Absolute fallback (central plaza safe default)
    return { x: 18.5, y: 14.5 };
  }
}
