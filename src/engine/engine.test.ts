/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { CollisionSystem } from './collision.ts';
import { PathfindingSystem } from './pathfinding.ts';
import { ProgressionSystem, INITIAL_PROGRESS } from './progression.ts';

test('CollisionSystem identifies boundaries and obstacles correctly', () => {
  const map = new CollisionSystem(20, 20);

  // Border should not be walkable
  assert.equal(map.isTileWalkable(0, 0), false);
  assert.equal(map.isTileWalkable(19, 10), false);

  // Open center tile should be walkable initially
  assert.equal(map.isTileWalkable(10, 10), true);

  // Add a building obstacle at (5, 5) with size 4x3
  map.addCollider({ x: 5, y: 5, width: 4, height: 3 });

  // Inside the obstacle should not be walkable
  assert.equal(map.isTileWalkable(5, 5), false);
  assert.equal(map.isTileWalkable(7, 6), false);

  // Just outside the obstacle should be walkable
  assert.equal(map.isTileWalkable(4, 5), true);
  assert.equal(map.isTileWalkable(9, 5), true);
});

test('CollisionSystem finds nearest safe position if spawned in obstacle', () => {
  const map = new CollisionSystem(10, 10);
  map.addCollider({ x: 2, y: 2, width: 3, height: 3 });

  // Point (3, 3) is inside obstacle
  assert.equal(map.isTileWalkable(3, 3), false);

  const safe = map.findNearestSafePosition(3, 3);
  assert.equal(map.isTileWalkable(safe.x, safe.y), true);
});

test('PathfindingSystem finds a path around an obstacle', () => {
  const map = new CollisionSystem(15, 15);
  // Wall from (5, 2) to (5, 8)
  map.addCollider({ x: 5, y: 2, width: 1, height: 7 });

  const pf = new PathfindingSystem(map);

  // Path from (3, 5) to (7, 5) must go around the wall
  const path = pf.findPath(3, 5, 7, 5);

  assert.ok(path.length > 0, 'Path should be found');
  const endPoint = path[path.length - 1];
  assert.equal(Math.floor(endPoint.x), 7);
  assert.equal(Math.floor(endPoint.y), 5);

  // None of the waypoints should be inside the wall
  for (const pt of path) {
    assert.equal(map.isTileWalkable(pt.x, pt.y), true);
  }
});

test('PathfindingSystem handles clicking on a building by navigating to an adjacent tile', () => {
  const map = new CollisionSystem(15, 15);
  // Building at (8, 8) size 3x3
  map.addCollider({ x: 8, y: 8, width: 3, height: 3 });

  const pf = new PathfindingSystem(map);
  // Clicking directly at center of building (9, 9)
  const path = pf.findPath(2, 2, 9, 9);

  assert.ok(path.length > 0, 'Path should be found to adjacent tile');
  const dest = path[path.length - 1];
  // Destination must be walkable
  assert.equal(map.isTileWalkable(dest.x, dest.y), true);
  // Destination should be adjacent to the building
  const dist = Math.min(
    Math.abs(Math.floor(dest.x) - 8),
    Math.abs(Math.floor(dest.y) - 8)
  );
  assert.ok(dist <= 3);
});

test('ProgressionSystem manages XP, level-up and unlock conditions', () => {
  const p = { ...INITIAL_PROGRESS };

  // Initial check: STEM lab is locked for Level 1 with 0 quizzes
  const stemStatus = ProgressionSystem.isBuildingUnlocked('stem_lab', p);
  assert.equal(stemStatus.unlocked, false);

  // Add 160 XP -> triggers level up from 1 to 2
  const result = ProgressionSystem.addXP(p, 160, 50);
  assert.equal(result.didLevelUp, true);
  assert.equal(result.updatedProgress.level, 2);
  assert.equal(result.updatedProgress.currentXP, 10); // 160 - 150 = 10

  // At Level 2, STEM lab should now be unlocked!
  const stemStatusLvl2 = ProgressionSystem.isBuildingUnlocked(
    'stem_lab',
    result.updatedProgress
  );
  assert.equal(stemStatusLvl2.unlocked, true);

  // Check outfit unlocks at Level 2
  const unlocked = ProgressionSystem.checkNewlyUnlockedItems(result.updatedProgress);
  assert.ok(unlocked.includes('hoodie'));
});
