/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  BuildingId,
  BuildingInfo,
  CharacterConfig,
  Direction,
  PlayerProgress,
} from '@/types/game';
import {
  BUILDINGS,
  MAP_TILES_X,
  MAP_TILES_Y,
  TILE_SIZE,
  getCityColliders,
  getProximityBuilding,
} from '@/game/engine/cityData';
import { CollisionSystem } from '@/game/engine/collision';
import { PathfindingSystem } from '@/game/engine/pathfinding';
import { ProgressionSystem } from '@/game/engine/progression';
import { sound } from '@/lib/audio';
import { X, ArrowRight, Sparkles, Lock } from 'lucide-react';

interface CityMapCanvasProps {
  character: CharacterConfig;
  progress: PlayerProgress;
  onEnterBuilding: (building: BuildingInfo) => void;
  onPositionChange?: (pos: { x: number; y: number }, facing: Direction) => void;
  onRequestEditCharacter: () => void;
  onNearbyBuildingChange?: (building: BuildingInfo | null) => void;
  /** Khi đang mở một địa điểm (modal), dừng cập nhật/vẽ và bỏ qua phím di chuyển. */
  paused?: boolean;
  /** Tắt lá bay, bụi bước chân và camera trượt (prefers-reduced-motion). */
  reducedMotion?: boolean;
  playerRefExternal?: React.MutableRefObject<CityPlayerHandle | null>;
}

export interface CityPlayerHandle {
  teleportTo: (x: number, y: number, facing?: Direction) => void;
  moveByInput: (dx: number, dy: number) => void;
  /** Vào địa điểm đang đứng gần (theo vị trí thật trong engine). */
  interact: () => void;
  triggerCelebration?: () => void;
}

// next/font đổi tên họ phông (ví dụ "__Be_Vietnam_Pro_abc"), nên canvas đọc tên thật từ CSS lúc chạy.
let uiFontFamily = '"Be Vietnam Pro", sans-serif';

interface DustParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  life: number;
}

interface DriftingLeaf {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  angle: number;
  color: string;
}

export const CityMapCanvas: React.FC<CityMapCanvasProps> = ({
  character,
  progress,
  onEnterBuilding,
  onPositionChange,
  onRequestEditCharacter: _onRequestEditCharacter,
  onNearbyBuildingChange,
  paused = false,
  reducedMotion = false,
  playerRefExternal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(paused);
  const reducedMotionRef = useRef(reducedMotion);
  const groundCacheRef = useRef<HTMLCanvasElement | null>(null);
  const onEnterBuildingRef = useRef(onEnterBuilding);
  onEnterBuildingRef.current = onEnterBuilding;

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      // Tránh nhân vật tiếp tục chạy vì phím còn "đang giữ" khi modal mở
      stateRef.current.keys.clear();
      stateRef.current.virtualInput = { dx: 0, dy: 0 };
      stateRef.current.path = [];
    }
  }, [paused]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  // Active interaction prompt in proximity
  const [nearbyBuilding, setNearbyBuilding] = useState<BuildingInfo | null>(null);
  const [dismissedBuildingId, setDismissedBuildingId] = useState<BuildingId | null>(null);
  const [targetToast, setTargetToast] = useState<string | null>(null);

  // Simulation state kept in refs for smooth 60fps rendering
  const stateRef = useRef({
    player: {
      x: progress.lastPosition?.x ?? 18.0,
      y: progress.lastPosition?.y ?? 7.5,
      facing: (progress.lastFacing as Direction) ?? 'down',
      isWalking: false,
      stepFrame: 0,
      stepDistAcc: 0,
      celebrateTimer: 0, // > 0 when celebrating
    },
    camera: {
      x: 0,
      y: 0,
    },
    path: [] as { x: number; y: number }[],
    keys: new Set<string>(),
    virtualInput: { dx: 0, dy: 0 },
    animFrameId: 0,
    lastTime: performance.now(),
    waterTick: 0,
    clockTime: { hours: 8, minutes: 15 },
    particles: [] as DustParticle[],
    leaves: [] as DriftingLeaf[],
  });

  const collisionRef = useRef(new CollisionSystem(MAP_TILES_X, MAP_TILES_Y));
  const pathfindingRef = useRef<PathfindingSystem | null>(null);

  // Initialize leaves & colliders
  useEffect(() => {
    const col = collisionRef.current;
    col.setColliders(getCityColliders());

    // Validate spawn point
    const safe = col.findNearestSafePosition(
      stateRef.current.player.x,
      stateRef.current.player.y
    );
    stateRef.current.player.x = safe.x;
    stateRef.current.player.y = safe.y;

    pathfindingRef.current = new PathfindingSystem(col);

    // Seed gentle drifting leaves
    const initialLeaves: DriftingLeaf[] = [];
    for (let i = 0; i < 15; i++) {
      initialLeaves.push({
        x: Math.random() * MAP_TILES_X * TILE_SIZE,
        y: Math.random() * MAP_TILES_Y * TILE_SIZE,
        speedX: 0.3 + Math.random() * 0.5,
        speedY: 0.15 + Math.random() * 0.3,
        angle: Math.random() * Math.PI * 2,
        color: ['#86EFAC', '#4ADE80', '#FCD34D', '#FBBF24'][Math.floor(Math.random() * 4)],
      });
    }
    stateRef.current.leaves = initialLeaves;
  }, []);

  // Expose teleport, move, and celebration controls
  useEffect(() => {
    if (playerRefExternal) {
      playerRefExternal.current = {
        teleportTo: (x: number, y: number, facing: Direction = 'down') => {
          const col = collisionRef.current;
          const safe = col.findNearestSafePosition(x, y);
          stateRef.current.player.x = safe.x;
          stateRef.current.player.y = safe.y;
          stateRef.current.player.facing = facing;
          stateRef.current.path = [];
          setDismissedBuildingId(null);
          sound.playInteract();
        },
        moveByInput: (dx: number, dy: number) => {
          stateRef.current.virtualInput = { dx, dy };
          if (dx !== 0 || dy !== 0) {
            setDismissedBuildingId(null);
          }
        },
        interact: () => {
          const prox = getProximityBuilding(
            stateRef.current.player.x,
            stateRef.current.player.y
          );
          if (prox) onEnterBuildingRef.current(prox);
        },
        triggerCelebration: () => {
          if (!reducedMotionRef.current) {
            stateRef.current.player.celebrateTimer = 1.6; // 1.6 seconds celebration
          }
          sound.playLevelUp();
        },
      };
    }
  }, [playerRefExternal]);

  // Click-to-move / Pathfinding handler
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !pathfindingRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert screen click to world tile coordinates
      const worldX = (clickX + stateRef.current.camera.x) / TILE_SIZE;
      const worldY = (clickY + stateRef.current.camera.y) / TILE_SIZE;

      const start = {
        x: stateRef.current.player.x,
        y: stateRef.current.player.y,
      };

      const path = pathfindingRef.current.findPath(
        start.x,
        start.y,
        worldX,
        worldY
      );

      if (path.length > 0) {
        stateRef.current.path = path;
        setDismissedBuildingId(null);
        sound.playClick();
        setTargetToast(null);
      } else {
        sound.playError();
        setTargetToast('Vị trí này không thể đi tới. Hãy chọn một con đường gần đó!');
        setTimeout(() => setTargetToast(null), 2500);
      }
    },
    []
  );

  // Keyboard navigation & interaction listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Không di chuyển nhân vật khi có hộp thoại đang mở (danh sách khu vực, nhiệm vụ, nhân vật…)
      if (pausedRef.current || document.querySelector('[aria-modal="true"]')) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      // Phím Enter/Space trên một nút đang được focus phải kích hoạt nút đó, không vào tòa nhà
      const onButton = e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;

      stateRef.current.keys.add(e.code);
      setDismissedBuildingId(null);

      // Escape dismisses current proximity card
      if (e.code === 'Escape' && nearbyBuilding) {
        setDismissedBuildingId(nearbyBuilding.id);
      }

      // Interact with nearby building on [E] or [Space] or [Enter]
      if (e.code === 'KeyE' || (!onButton && (e.code === 'Space' || e.code === 'Enter'))) {
        const prox = getProximityBuilding(
          stateRef.current.player.x,
          stateRef.current.player.y
        );
        if (prox) {
          e.preventDefault();
          onEnterBuilding(prox);
        }
      }

      // Mute audio on [M]
      if (e.code === 'KeyM') {
        sound.toggleMute();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys.delete(e.code);
    };

    const handleBlur = () => {
      stateRef.current.keys.clear();
      stateRef.current.virtualInput = { dx: 0, dy: 0 };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [nearbyBuilding, onEnterBuilding]);

  // Main 60 FPS Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    uiFontFamily = getComputedStyle(document.body).fontFamily || uiFontFamily;
    let running = true;
    let lastSaveTime = performance.now();
    let wasWalking = false;

    const loop = (time: number) => {
      if (!running) return;

      // Đang mở modal hoặc tab bị ẩn: không cập nhật, không vẽ
      if (pausedRef.current || document.hidden) {
        stateRef.current.lastTime = time;
        stateRef.current.animFrameId = requestAnimationFrame(loop);
        return;
      }
      const calm = reducedMotionRef.current;

      const rawDt = (time - stateRef.current.lastTime) / 1000;
      stateRef.current.lastTime = time;
      const dt = Math.min(rawDt, 0.05);
      stateRef.current.waterTick += dt * 3.5;

      const player = stateRef.current.player;
      const keys = stateRef.current.keys;
      const vInput = stateRef.current.virtualInput;
      const collision = collisionRef.current;

      if (player.celebrateTimer > 0) {
        player.celebrateTimer -= dt;
      }

      let moveX = 0;
      let moveY = 0;

      if (keys.has('KeyW') || keys.has('ArrowUp')) moveY -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) moveY += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;

      if (vInput.dx !== 0 || vInput.dy !== 0) {
        moveX += vInput.dx;
        moveY += vInput.dy;
      }

      const speed = 4.2; // tiles per second

      // Input movement
      if (moveX !== 0 || moveY !== 0) {
        stateRef.current.path = [];

        const len = Math.hypot(moveX, moveY);
        const normX = (moveX / len) * speed * dt;
        const normY = (moveY / len) * speed * dt;

        // Slide along walls with axis independence
        if (collision.canMoveTo(player.x + normX, player.y)) {
          player.x += normX;
        }
        if (collision.canMoveTo(player.x, player.y + normY)) {
          player.y += normY;
        }

        player.isWalking = true;
        if (Math.abs(moveX) > Math.abs(moveY)) {
          player.facing = moveX > 0 ? 'right' : 'left';
        } else {
          player.facing = moveY > 0 ? 'down' : 'up';
        }

        // Footstep tracking & dust
        player.stepDistAcc += Math.hypot(normX, normY);
        if (player.stepDistAcc > 0.42) {
          player.stepFrame = (player.stepFrame + 1) % 4;
          player.stepDistAcc = 0;
          sound.playStep();

          // Spawn subtle footstep dust
          if (!calm) stateRef.current.particles.push({
            x: player.x * TILE_SIZE + (Math.random() - 0.5) * 8,
            y: player.y * TILE_SIZE + 18,
            size: 3 + Math.random() * 2,
            alpha: 0.6,
            life: 0.35,
          });
        }
      } else if (stateRef.current.path.length > 0) {
        // Pathfinding navigation
        const nextTarget = stateRef.current.path[0];
        const dx = nextTarget.x - player.x;
        const dy = nextTarget.y - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.12) {
          player.x = nextTarget.x;
          player.y = nextTarget.y;
          stateRef.current.path.shift();
        } else {
          const step = Math.min(speed * dt, dist);
          const dirX = (dx / dist) * step;
          const dirY = (dy / dist) * step;

          if (collision.canMoveTo(player.x + dirX, player.y + dirY)) {
            player.x += dirX;
            player.y += dirY;
          } else {
            stateRef.current.path = [];
          }

          player.isWalking = true;
          if (Math.abs(dx) > Math.abs(dy)) {
            player.facing = dx > 0 ? 'right' : 'left';
          } else {
            player.facing = dy > 0 ? 'down' : 'up';
          }

          player.stepDistAcc += step;
          if (player.stepDistAcc > 0.42) {
            player.stepFrame = (player.stepFrame + 1) % 4;
            player.stepDistAcc = 0;
            sound.playStep();

            if (!calm) stateRef.current.particles.push({
              x: player.x * TILE_SIZE,
              y: player.y * TILE_SIZE + 18,
              size: 3,
              alpha: 0.6,
              life: 0.35,
            });
          }
        }
      } else {
        player.isWalking = false;
        player.stepFrame = 0;
      }

      // Update particles
      for (let i = stateRef.current.particles.length - 1; i >= 0; i--) {
        const p = stateRef.current.particles[i];
        p.life -= dt;
        p.alpha = Math.max(0, p.life / 0.35);
        p.y -= dt * 6;
        if (p.life <= 0) {
          stateRef.current.particles.splice(i, 1);
        }
      }

      // Update drifting leaves
      const worldW = MAP_TILES_X * TILE_SIZE;
      const worldH = MAP_TILES_Y * TILE_SIZE;
      if (!calm) stateRef.current.leaves.forEach((leaf) => {
        leaf.x += leaf.speedX;
        leaf.y += leaf.speedY;
        leaf.angle += dt * 1.5;
        if (leaf.x > worldW) leaf.x = 0;
        if (leaf.y > worldH) leaf.y = 0;
      });

      // Check proximity to buildings (BUILDINGS là object cố định nên React bỏ qua nếu không đổi)
      const nearby = getProximityBuilding(player.x, player.y);
      setNearbyBuilding(nearby);

      // Lưu vị trí: tối đa mỗi 1,5 s khi đang đi, và đúng một lần lúc dừng lại.
      // (Bản gốc gọi mỗi khung hình khi đứng yên → render lại toàn app 60 lần/giây.)
      const shouldSave = player.isWalking ? time - lastSaveTime > 1500 : wasWalking;
      if (onPositionChange && shouldSave) {
        onPositionChange({ x: player.x, y: player.y }, player.facing);
        lastSaveTime = time;
      }
      wasWalking = player.isWalking;

      // Smooth Responsive Camera tracking centered on player
      let targetCamX = player.x * TILE_SIZE - canvas.width / 2;
      let targetCamY = player.y * TILE_SIZE - canvas.height / 2;

      // Handle viewports wider or taller than the game world by centering the canvas
      if (canvas.width >= worldW) {
        targetCamX = -(canvas.width - worldW) / 2;
      } else {
        targetCamX = Math.max(0, Math.min(worldW - canvas.width, targetCamX));
      }

      if (canvas.height >= worldH) {
        targetCamY = -(canvas.height - worldH) / 2;
      } else {
        targetCamY = Math.max(0, Math.min(worldH - canvas.height, targetCamY));
      }

      // Smooth cinematic lerp (0.14); giảm chuyển động → camera bám tức thì
      const lerp = calm ? 1 : 0.14;
      stateRef.current.camera.x += (targetCamX - stateRef.current.camera.x) * lerp;
      stateRef.current.camera.y += (targetCamY - stateRef.current.camera.y) * lerp;

      // Render entire scene
      renderScene(ctx, canvas.width, canvas.height, time);

      stateRef.current.animFrameId = requestAnimationFrame(loop);
    };

    // Render helper function with full pixel-art layering and depth sorting
    const renderScene = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      time: number
    ) => {
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;

      const camX = Math.round(stateRef.current.camera.x);
      const camY = Math.round(stateRef.current.camera.y);

      ctx.save();
      ctx.translate(-camX, -camY);

      // 1. GROUND (Lush organic grass, cobblestone avenues, brick curbs, plaza)
      // Nền tĩnh → vẽ một lần vào canvas phụ rồi dán lại mỗi khung hình
      if (!groundCacheRef.current) {
        const cache = document.createElement('canvas');
        cache.width = MAP_TILES_X * TILE_SIZE;
        cache.height = MAP_TILES_Y * TILE_SIZE;
        const cctx = cache.getContext('2d');
        if (cctx) {
          cctx.imageSmoothingEnabled = false;
          drawGround(cctx);
          groundCacheRef.current = cache;
        } else {
          drawGround(ctx);
        }
      }
      if (groundCacheRef.current) ctx.drawImage(groundCacheRef.current, 0, 0);

      // 2. PATHFINDING TRAIL
      drawPathTrail(ctx);

      // 3. CENTRAL FOUNTAIN
      drawFountain(ctx, stateRef.current.waterTick);

      // 4. BUILDINGS (Static architectural facades)
      drawBuildings(ctx, time);

      // 5. Y-SORTED ENTITIES (Trees, player, street lamps, benches, flagpole)
      drawDepthSortedEntities(ctx, time);

      // 6. PARTICLES & ENVIRONMENTAL EFFECTS
      if (!reducedMotionRef.current) drawParticlesAndLeaves(ctx);

      // 7. QUEST ALERT MARKERS OVER BUILDINGS
      drawQuestMarkers(ctx, time);

      ctx.restore();
    };

    stateRef.current.animFrameId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(stateRef.current.animFrameId);
    };
  }, [onPositionChange]);

  useEffect(() => {
    onNearbyBuildingChange?.(nearbyBuilding);
  }, [nearbyBuilding, onNearbyBuildingChange]);

  // Resize canvas to match display size
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ==========================================
  // DRAWING HELPER FUNCTIONS
  // ==========================================

  const drawGround = (ctx: CanvasRenderingContext2D) => {
    const worldW = MAP_TILES_X * TILE_SIZE;
    const worldH = MAP_TILES_Y * TILE_SIZE;

    // 1. ORGANIC BASE GRASS (Rich deep nature green, no square checkerboard)
    ctx.fillStyle = '#276E36';
    ctx.fillRect(0, 0, worldW, worldH);

    // 2. ORGANIC MEADOW PATCHES (Rolling natural soft clumps across the city)
    const grassPatches = [
      { x: 3, y: 3, w: 9, h: 5 },
      { x: 24, y: 3, w: 9, h: 5 },
      { x: 2, y: 16, w: 10, h: 6 },
      { x: 23, y: 16, w: 10, h: 6 },
      { x: 12, y: 1, w: 12, h: 5 },
      { x: 8, y: 10, w: 6, h: 4 },
      { x: 22, y: 10, w: 6, h: 4 },
    ];

    ctx.fillStyle = '#318442';
    grassPatches.forEach((gp) => {
      ctx.beginPath();
      ctx.ellipse(
        (gp.x + gp.w / 2) * TILE_SIZE,
        (gp.y + gp.h / 2) * TILE_SIZE,
        (gp.w * TILE_SIZE) / 2,
        (gp.h * TILE_SIZE) / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // Subtle velvet highlights inside organic meadows
    ctx.fillStyle = '#3CA050';
    grassPatches.forEach((gp, idx) => {
      if (idx % 2 === 0) {
        ctx.beginPath();
        ctx.ellipse(
          (gp.x + gp.w / 2) * TILE_SIZE + 10,
          (gp.y + gp.h / 2) * TILE_SIZE - 8,
          (gp.w * TILE_SIZE) / 3.2,
          (gp.h * TILE_SIZE) / 3.2,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    });

    // Delicate grass blade tufts scattered on soil
    ctx.fillStyle = '#4ADE8055';
    for (let i = 0; i < 45; i++) {
      const gx = ((i * 43 + 17) % (worldW - 40)) + 20;
      const gy = ((i * 67 + 29) % (worldH - 40)) + 20;
      // Skip avenue intersections
      if (!(gx > 14 * TILE_SIZE && gx < 22 * TILE_SIZE) && !(gy > 10 * TILE_SIZE && gy < 16 * TILE_SIZE)) {
        ctx.fillRect(gx, gy, 2, 4);
        ctx.fillRect(gx + 2, gy - 2, 2, 4);
      }
    }

    // Wildflowers clustered naturally near path borders
    // Buttercups (Yellow with amber center)
    for (let i = 0; i < 30; i++) {
      const fx = ((i * 37 + 19) % (worldW - 60)) + 30;
      const fy = ((i * 53 + 11) % (worldH - 60)) + 30;
      if (!(fx > 15 * TILE_SIZE && fx < 21 * TILE_SIZE) && !(fy > 11 * TILE_SIZE && fy < 15 * TILE_SIZE)) {
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(fx, fy, 3, 3);
        ctx.fillStyle = '#EA580C';
        ctx.fillRect(fx + 1, fy + 1, 1, 1);
      }
    }

    // White clover blossoms
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 25; i++) {
      const fx = ((i * 61 + 23) % (worldW - 60)) + 30;
      const fy = ((i * 79 + 37) % (worldH - 60)) + 30;
      if (!(fx > 15 * TILE_SIZE && fx < 21 * TILE_SIZE) && !(fy > 11 * TILE_SIZE && fy < 15 * TILE_SIZE)) {
        ctx.fillRect(fx, fy, 2, 2);
      }
    }

    // ==========================================
    // 3. CENTRAL BOULEVARDS & GRAND AVENUE
    // ==========================================

    // North-South Campus Avenue (x: 16 to 20)
    ctx.fillStyle = '#6E6760'; // Warm stone paver base
    ctx.fillRect(16 * TILE_SIZE, 0, 4 * TILE_SIZE, worldH);

    // East-West Central Boulevard (y: 11 to 15)
    ctx.fillRect(0, 11 * TILE_SIZE, worldW, 4 * TILE_SIZE);

    // Staggered paving stone texture on main boulevards
    ctx.strokeStyle = '#4D474133';
    ctx.lineWidth = 1;
    for (let x = 0; x < MAP_TILES_X; x++) {
      for (let y = 0; y < MAP_TILES_Y; y++) {
        if ((x >= 16 && x < 20) || (y >= 11 && y < 15)) {
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          // Subdivided pavers
          ctx.strokeRect(px, py, TILE_SIZE / 2, TILE_SIZE / 2);
          ctx.strokeRect(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2);
        }
      }
    }

    // Stone Curb Bevels bordering avenues
    ctx.fillStyle = '#3E3A37';
    for (let i = 0; i < MAP_TILES_X; i++) {
      ctx.fillRect(i * TILE_SIZE, 11 * TILE_SIZE, TILE_SIZE, 3);
      ctx.fillRect(i * TILE_SIZE, 15 * TILE_SIZE - 3, TILE_SIZE, 3);
    }
    for (let j = 0; j < MAP_TILES_Y; j++) {
      ctx.fillRect(16 * TILE_SIZE, j * TILE_SIZE, 3, TILE_SIZE);
      ctx.fillRect(20 * TILE_SIZE - 3, j * TILE_SIZE, 3, TILE_SIZE);
    }
    // Highlighted stone curb edge
    ctx.fillStyle = '#9C948D44';
    ctx.fillRect(0, 11 * TILE_SIZE + 3, worldW, 1.5);
    ctx.fillRect(0, 15 * TILE_SIZE - 4.5, worldW, 1.5);
    ctx.fillRect(16 * TILE_SIZE + 3, 0, 1.5, worldH);
    ctx.fillRect(20 * TILE_SIZE - 4.5, 0, 1.5, worldH);

    // ==========================================
    // 4. DISTINCT THEMED ACCESS ROADS PER ZONE
    // ==========================================

    // A. School Front Courtyard & North Approach (x: 14 to 22, y: 6.2 to 8.6)
    ctx.fillStyle = '#E7E5E4'; // Elegant limestone courtyard
    ctx.fillRect(14.5 * TILE_SIZE, 6.2 * TILE_SIZE, 7 * TILE_SIZE, 2.5 * TILE_SIZE);
    ctx.fillStyle = '#D6D3D1';
    for (let bx = 15; bx < 21; bx++) {
      ctx.fillRect(bx * TILE_SIZE, 8.5 * TILE_SIZE, TILE_SIZE, 3);
    }
    // Red welcome runner on school entrance steps
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(17.2 * TILE_SIZE, 6.4 * TILE_SIZE, 1.6 * TILE_SIZE, 2.2 * TILE_SIZE);

    // B. Library Access Road (NW - x: 3 to 16, y: 9 to 11)
    // Warm Terracotta Brick Herringbone
    ctx.fillStyle = '#B45309';
    ctx.fillRect(3 * TILE_SIZE, 9 * TILE_SIZE, 13 * TILE_SIZE, 2 * TILE_SIZE);
    // Brick pattern lines
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1;
    for (let lx = 3; lx < 16; lx++) {
      ctx.strokeRect(lx * TILE_SIZE, 9 * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      ctx.strokeRect(lx * TILE_SIZE + 12, 10 * TILE_SIZE, TILE_SIZE - 12, TILE_SIZE);
    }
    // Lavender flower beds along library road
    ctx.fillStyle = '#A855F7';
    for (let k = 0; k < 12; k++) {
      ctx.fillRect(3.2 * TILE_SIZE + k * 45, 8.7 * TILE_SIZE, 8, 8);
      ctx.fillRect(3.2 * TILE_SIZE + k * 45 + 2, 8.7 * TILE_SIZE - 2, 4, 3);
    }

    // C. STEM Lab Access Road (NE - x: 20 to 33, y: 9 to 11)
    // High-tech Slate with illuminated cyan energy conduits
    ctx.fillStyle = '#334155';
    ctx.fillRect(20 * TILE_SIZE, 9 * TILE_SIZE, 13 * TILE_SIZE, 2 * TILE_SIZE);
    ctx.fillStyle = '#475569';
    for (let sx = 20; sx < 33; sx++) {
      ctx.fillRect(sx * TILE_SIZE + 4, 9 * TILE_SIZE + 4, TILE_SIZE - 8, 2 * TILE_SIZE - 8);
    }
    // Glowing cyan circuit trace along STEM walkway
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(20 * TILE_SIZE, 9.95 * TILE_SIZE, 13 * TILE_SIZE, 2);
    ctx.fillRect(32 * TILE_SIZE, 9.4 * TILE_SIZE, 2, 1.2 * TILE_SIZE);

    // D. Quiz Arcade Access Road (SW - x: 3 to 16, y: 13 to 15)
    // Deep Purple Mosaic with neon pavers
    ctx.fillStyle = '#581C87';
    ctx.fillRect(3 * TILE_SIZE, 13 * TILE_SIZE, 13 * TILE_SIZE, 2 * TILE_SIZE);
    ctx.fillStyle = '#6B21A8';
    for (let ax = 3; ax < 16; ax++) {
      ctx.fillRect(ax * TILE_SIZE + 6, 13 * TILE_SIZE + 4, TILE_SIZE - 12, 2 * TILE_SIZE - 8);
    }
    // Playful neon yellow & magenta mosaic dots
    for (let m = 0; m < 14; m++) {
      ctx.fillStyle = m % 2 === 0 ? '#FDE047' : '#F43F5E';
      ctx.fillRect(3.5 * TILE_SIZE + m * 42, 13.9 * TILE_SIZE, 4, 4);
    }

    // E. Review Station Access Road (SE - x: 20 to 33, y: 13 to 15)
    // Industrial Red-Brown Brick & cobblestones
    ctx.fillStyle = '#7C2D12';
    ctx.fillRect(20 * TILE_SIZE, 13 * TILE_SIZE, 13 * TILE_SIZE, 2 * TILE_SIZE);
    ctx.fillStyle = '#9A3412';
    for (let rx = 20; rx < 33; rx++) {
      ctx.fillRect(rx * TILE_SIZE + 4, 13 * TILE_SIZE + 3, TILE_SIZE - 8, TILE_SIZE - 5);
      ctx.fillRect(rx * TILE_SIZE + 12, 14 * TILE_SIZE + 2, TILE_SIZE - 8, TILE_SIZE - 4);
    }
    // Stone gravel shoulders
    ctx.fillStyle = '#57534E';
    ctx.fillRect(20 * TILE_SIZE, 13 * TILE_SIZE - 2, 13 * TILE_SIZE, 2);
    ctx.fillRect(20 * TILE_SIZE, 15 * TILE_SIZE, 13 * TILE_SIZE, 2);

    // F. Trophy Plaza Southern Path (S - x: 16 to 20, y: 15 to 17)
    ctx.fillStyle = '#D97706';
    ctx.fillRect(16.5 * TILE_SIZE, 15 * TILE_SIZE, 3 * TILE_SIZE, 2 * TILE_SIZE);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(17 * TILE_SIZE, 15.2 * TILE_SIZE, 2 * TILE_SIZE, 1.6 * TILE_SIZE);
    // Red carpet runner leading into Trophy Plaza
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(17.5 * TILE_SIZE, 15.2 * TILE_SIZE, 1 * TILE_SIZE, 1.8 * TILE_SIZE);

    // ==========================================
    // 5. CENTRAL GRAND PLAZA (14 to 22 x, 8.5 to 15.5 y)
    // ==========================================
    ctx.fillStyle = '#CFC8C1'; // Light warm plaza stone
    ctx.fillRect(14 * TILE_SIZE, 8.5 * TILE_SIZE, 8 * TILE_SIZE, 7 * TILE_SIZE);

    // Inner Promenade Ring
    ctx.fillStyle = '#E5E1DC';
    ctx.beginPath();
    ctx.ellipse(18 * TILE_SIZE, 12 * TILE_SIZE, 3.6 * TILE_SIZE, 3.6 * TILE_SIZE, 0, 0, Math.PI * 2);
    ctx.fill();

    // Decorative Plaza Border Tiles
    ctx.strokeStyle = '#8C837A44';
    ctx.lineWidth = 1.5;
    for (let rad = 0; rad < 8; rad++) {
      const angle = (rad * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(18 * TILE_SIZE + Math.cos(angle) * 2 * TILE_SIZE, 12 * TILE_SIZE + Math.sin(angle) * 2 * TILE_SIZE);
      ctx.lineTo(18 * TILE_SIZE + Math.cos(angle) * 3.5 * TILE_SIZE, 12 * TILE_SIZE + Math.sin(angle) * 3.5 * TILE_SIZE);
      ctx.stroke();
    }

    // Pedestrian Crosswalk Stripes at central intersections
    ctx.fillStyle = '#F8FAFC';
    for (let k = 0; k < 6; k++) {
      // North crosswalk
      ctx.fillRect(16.5 * TILE_SIZE + k * 22, 10.2 * TILE_SIZE, 14, 28);
      // South crosswalk
      ctx.fillRect(16.5 * TILE_SIZE + k * 22, 15.2 * TILE_SIZE, 14, 28);
    }
  };

  const drawFountain = (ctx: CanvasRenderingContext2D, tick: number) => {
    const fx = 16 * TILE_SIZE;
    const fy = 10 * TILE_SIZE;
    const fw = 4 * TILE_SIZE;
    const fh = 4 * TILE_SIZE;

    // Drop shadow
    ctx.fillStyle = '#00000033';
    ctx.beginPath();
    ctx.ellipse(fx + fw / 2, fy + fh / 2 + 6, fw / 2 + 6, fh / 2 + 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Multi-tier Carved Stone Basin Rim
    ctx.fillStyle = '#78716C';
    ctx.beginPath();
    ctx.ellipse(fx + fw / 2, fy + fh / 2, fw / 2, fh / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#E7E5E4';
    ctx.beginPath();
    ctx.ellipse(fx + fw / 2, fy + fh / 2 - 2, fw / 2 - 4, fh / 2 - 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deep Aqua Water Pool
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.ellipse(fx + fw / 2, fy + fh / 2, fw / 2 - 10, fh / 2 - 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Animated Expanding Water Ripple Waves
    for (let i = 0; i < 4; i++) {
      const radius = ((tick * 16 + i * 22) % (fw / 2 - 14)) + 6;
      ctx.beginPath();
      ctx.ellipse(fx + fw / 2, fy + fh / 2, radius, radius * 0.72, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Center Tiered Pedestal
    ctx.fillStyle = '#D6D3D1';
    ctx.fillRect(fx + fw / 2 - 14, fy + fh / 2 - 20, 28, 22);
    ctx.fillStyle = '#A8A29E';
    ctx.fillRect(fx + fw / 2 - 10, fy + fh / 2 - 28, 20, 10);

    // Glowing Water Jets / Spout
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(fx + fw / 2, fy + fh / 2 - 28, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(fx + fw / 2, fy + fh / 2 - 32, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawBuildings = (ctx: CanvasRenderingContext2D, time: number) => {
    // 1. Central School (Trường THCS EDUVERSE) - Redesigned with rich classical architecture
    drawCentralSchool(ctx, BUILDINGS.school, time);

    // 2. Library (Thư Viện Tri Thức KHTN)
    drawLibrary(ctx, BUILDINGS.library, time);

    // 3. STEM Lab (Phòng Thí Nghiệm STEM)
    drawStemLab(ctx, BUILDINGS.stem_lab, time);

    // 4. Quiz Arcade (Đấu Trường Quiz Arcade)
    drawQuizArcade(ctx, BUILDINGS.quiz_arcade, time);

    // 5. Review Station (Trạm Sửa Lỗi Cứu Nguy)
    drawReviewStation(ctx, BUILDINGS.review_station, time);

    // 6. Achievement Plaza (Quảng Trường Vinh Danh)
    drawAchievementPlaza(ctx, BUILDINGS.achievement_plaza, time);

    // 7. Virtual Lab (Phòng Thí Nghiệm Ảo)
    if (BUILDINGS.virtual_lab) drawVirtualLab(ctx, BUILDINGS.virtual_lab, time);

    // 8. 3D World (Thế Giới 3D)
    if (BUILDINGS.world_3d) drawWorld3D(ctx, BUILDINGS.world_3d, time);
  };

  // ==========================================
  // INDIVIDUAL BUILDING RENDERERS
  // ==========================================

  const drawCentralSchool = (ctx: CanvasRenderingContext2D, b: BuildingInfo, time: number) => {
    const bx = b.x * TILE_SIZE;
    const by = b.y * TILE_SIZE;
    const bw = b.width * TILE_SIZE;
    const bh = b.height * TILE_SIZE;

    const isNearby = nearbyBuilding?.id === b.id;

    // Drop shadow
    ctx.fillStyle = '#00000033';
    ctx.fillRect(bx + 10, by + bh - 6, bw, 20);

    // Main Facade: Rich Colonial Warm Cream Masonry
    ctx.fillStyle = '#FEF3C7'; // Warm ivory brick wall
    ctx.fillRect(bx, by + 34, bw, bh - 34);

    // Architectural Quoins / Corner Limestone Pillars
    ctx.fillStyle = '#F59E0B22';
    ctx.fillRect(bx, by + 34, 18, bh - 34);
    ctx.fillRect(bx + bw - 18, by + 34, 18, bh - 34);

    // Central Building Pavilion (Protruding slightly for depth)
    const cw = 160;
    const cx = bx + bw / 2 - cw / 2;
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(cx, by + 26, cw, bh - 26);

    // Multi-tier Pitched Terracotta Roof
    // Left Wing Roof
    ctx.fillStyle = '#DC2626'; // Vietnamese school red roof tiles
    ctx.beginPath();
    ctx.moveTo(bx - 12, by + 34);
    ctx.lineTo(cx, by + 8);
    ctx.lineTo(cx, by + 34);
    ctx.closePath();
    ctx.fill();

    // Right Wing Roof
    ctx.beginPath();
    ctx.moveTo(cx + cw, by + 8);
    ctx.lineTo(bx + bw + 12, by + 34);
    ctx.lineTo(cx + cw, by + 34);
    ctx.closePath();
    ctx.fill();

    // Center Pediment & Clock Tower
    ctx.fillStyle = '#B91C1C';
    ctx.beginPath();
    ctx.moveTo(cx - 8, by + 26);
    ctx.lineTo(bx + bw / 2, by - 22);
    ctx.lineTo(cx + cw + 8, by + 26);
    ctx.closePath();
    ctx.fill();

    // Clock Tower Spire & Clock Face
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(bx + bw / 2, by - 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Moving Clock Hands
    const minuteAngle = (time * 0.0005) % (Math.PI * 2);
    const hourAngle = minuteAngle / 12;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2, by - 2);
    ctx.lineTo(bx + bw / 2 + Math.cos(minuteAngle) * 8, by - 2 + Math.sin(minuteAngle) * 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2, by - 2);
    ctx.lineTo(bx + bw / 2 + Math.cos(hourAngle) * 5, by - 2 + Math.sin(hourAngle) * 5);
    ctx.stroke();

    // School Banner Plaque: "TRƯỜNG THCS VINA-EDUVERSE"
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(bx + bw / 2 - 110, by + 16, 220, 24);
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + bw / 2 - 110, by + 16, 220, 24);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 11px ${uiFontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('🏫 TRƯỜNG THCS VINA-EDUVERSE', bx + bw / 2, by + 32);

    // Symmetrical Arched Windows with glass reflections
    const drawWindow = (wx: number, wy: number) => {
      ctx.fillStyle = '#78350F'; // Dark wood frame
      ctx.fillRect(wx, wy, 26, 32);
      ctx.fillStyle = '#BAE6FD'; // Glass pane
      ctx.fillRect(wx + 2, wy + 2, 22, 28);
      // Window panes divider
      ctx.fillStyle = '#78350F';
      ctx.fillRect(wx + 12, wy + 2, 2, 28);
      ctx.fillRect(wx + 2, wy + 16, 22, 2);
      // Reflection glare
      ctx.fillStyle = '#FFFFFF88';
      ctx.beginPath();
      ctx.moveTo(wx + 4, wy + 4);
      ctx.lineTo(wx + 10, wy + 4);
      ctx.lineTo(wx + 4, wy + 14);
      ctx.closePath();
      ctx.fill();
    };

    // Left Wing Windows
    drawWindow(bx + 24, by + 56);
    drawWindow(bx + 64, by + 56);
    drawWindow(bx + 104, by + 56);

    // Right Wing Windows
    drawWindow(bx + bw - 50, by + 56);
    drawWindow(bx + bw - 90, by + 56);
    drawWindow(bx + bw - 130, by + 56);

    // Grand Entrance Archway & Double Doors
    const doorX = bx + bw / 2 - 28;
    const doorY = by + bh - 54;

    if (isNearby) {
      const doorGlow = (Math.sin(time * 0.008) + 1) * 0.5;
      ctx.fillStyle = `rgba(245, 158, 11, ${0.15 + doorGlow * 0.2})`;
      ctx.fillRect(doorX - 12, doorY - 18, 80, 76);
    }

    ctx.fillStyle = '#B45309'; // Outer arch trim
    ctx.fillRect(doorX - 6, doorY - 14, 68, 68);

    // Double Mahogany Doors
    ctx.fillStyle = '#451A03';
    ctx.fillRect(doorX, doorY, 56, 54);
    // Door split line
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(doorX + 27, doorY, 2, 54);
    // Brass Handles
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(doorX + 22, doorY + 28, 3, 6);
    ctx.fillRect(doorX + 31, doorY + 28, 3, 6);

    // Multi-tier Granite Entrance Steps
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(doorX - 14, by + bh - 6, 84, 8);
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(doorX - 22, by + bh + 2, 100, 8);
    ctx.fillStyle = '#EF4444'; // Red welcome carpet runner
    ctx.fillRect(doorX + 8, by + bh - 6, 40, 18);

    // School Flowerbed Planters flanking the steps
    ctx.fillStyle = '#78350F';
    ctx.fillRect(doorX - 42, by + bh - 4, 18, 14);
    ctx.fillRect(doorX + 80, by + bh - 4, 18, 14);
    ctx.fillStyle = '#16A34A';
    ctx.beginPath();
    ctx.arc(doorX - 33, by + bh - 8, 12, 0, Math.PI * 2);
    ctx.arc(doorX + 89, by + bh - 8, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E11D48'; // Red roses
    ctx.fillRect(doorX - 35, by + bh - 10, 4, 4);
    ctx.fillRect(doorX + 87, by + bh - 10, 4, 4);
  };

  const drawLibrary = (ctx: CanvasRenderingContext2D, b: BuildingInfo, time: number) => {
    const bx = b.x * TILE_SIZE;
    const by = b.y * TILE_SIZE;
    const bw = b.width * TILE_SIZE;
    const bh = b.height * TILE_SIZE;
    const isNearby = nearbyBuilding?.id === b.id;

    // 1. Soft Ambient Ground Shadow
    ctx.fillStyle = '#0000003D';
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + bh + 4, bw / 2 + 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sandstone Ashlar Base Plinth
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(bx - 4, by + bh - 16, bw + 8, 16);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(bx - 4, by + bh - 18, bw + 8, 2);

    // 3. Warm Ivory & Timber Academic Masonry Facade
    ctx.fillStyle = '#FEF9C3'; // Warm Ivory Stone Wall
    ctx.fillRect(bx, by + 36, bw, bh - 52);

    // Timber Corner Quoins / Decorative Ashlar Corners
    ctx.fillStyle = '#78350F';
    for (let qy = by + 36; qy < by + bh - 24; qy += 18) {
      ctx.fillRect(bx, qy, 14, 14);
      ctx.fillRect(bx + bw - 14, qy, 14, 14);
    }

    // Classical Stone Columns / Pilasters
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(bx + 26, by + 36, 12, bh - 52);
    ctx.fillRect(bx + bw - 38, by + 36, 12, bh - 52);

    // 4. Sloped Slate-Blue & Timber Double Pitched Roof with Shingles
    ctx.fillStyle = '#0369A1';
    ctx.beginPath();
    ctx.moveTo(bx - 10, by + 36);
    ctx.lineTo(bx + bw / 2, by);
    ctx.lineTo(bx + bw + 10, by + 36);
    ctx.closePath();
    ctx.fill();

    // Roof Shingle Overhang Trim
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(bx - 12, by + 34, bw + 24, 5);

    // Central Timber Dormer Window with Open Book Relief
    const dormW = 54;
    const dormX = bx + bw / 2 - dormW / 2;
    ctx.fillStyle = '#78350F';
    ctx.fillRect(dormX, by + 8, dormW, 26);
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.moveTo(dormX - 4, by + 10);
    ctx.lineTo(bx + bw / 2, by - 4);
    ctx.lineTo(dormX + dormW + 4, by + 10);
    ctx.closePath();
    ctx.fill();

    // Circular Rose Window / Book Relief Emblem
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(bx + bw / 2, by + 20, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#78350F';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📖', bx + bw / 2, by + 24);

    // 5. Leaded Bay Windows with Bookshelves Visible Inside & Flower Boxes
    const drawBayWindow = (wx: number, wy: number) => {
      // Dark timber frame
      ctx.fillStyle = '#451A03';
      ctx.fillRect(wx - 2, wy - 2, 54, 46);
      // Warm amber interior glow from library lamps
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(wx, wy, 50, 42);

      // Bookshelves with colorful book spines inside
      ctx.fillStyle = '#78350F'; // Shelf
      ctx.fillRect(wx + 2, wy + 20, 46, 3);
      // Row 1 books
      const spineColors = ['#DC2626', '#2563EB', '#16A34A', '#9333EA', '#D97706'];
      for (let bIdx = 0; bIdx < 7; bIdx++) {
        ctx.fillStyle = spineColors[bIdx % spineColors.length];
        ctx.fillRect(wx + 4 + bIdx * 6, wy + 6, 5, 14);
      }
      // Row 2 books
      for (let bIdx = 0; bIdx < 7; bIdx++) {
        ctx.fillStyle = spineColors[(bIdx + 2) % spineColors.length];
        ctx.fillRect(wx + 4 + bIdx * 6, wy + 23, 5, 14);
      }

      // Leaded window mullions
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx, wy, 50, 42);
      ctx.beginPath();
      ctx.moveTo(wx + 25, wy);
      ctx.lineTo(wx + 25, wy + 42);
      ctx.moveTo(wx, wy + 21);
      ctx.lineTo(wx + 50, wy + 21);
      ctx.stroke();

      // Flower Box beneath the window sill
      ctx.fillStyle = '#92400E';
      ctx.fillRect(wx - 2, wy + 42, 54, 8);
      // Green foliage
      ctx.fillStyle = '#15803D';
      ctx.fillRect(wx, wy + 40, 50, 4);
      // Little blossoming flowers (red & gold)
      for (let f = 0; f < 5; f++) {
        ctx.fillStyle = f % 2 === 0 ? '#EF4444' : '#FBBF24';
        ctx.fillRect(wx + 4 + f * 10, wy + 39, 3, 3);
      }
    };

    drawBayWindow(bx + 44, by + 58);
    drawBayWindow(bx + bw - 98, by + 58);

    // 6. Outdoor Reading Props
    // Left Lawn: Charming Wooden Park Bench
    const benchX = bx + 12;
    const benchY = by + bh - 24;
    ctx.fillStyle = '#00000033';
    ctx.fillRect(benchX, benchY + 12, 26, 4);
    ctx.fillStyle = '#78350F';
    ctx.fillRect(benchX + 2, benchY + 2, 22, 4);
    ctx.fillRect(benchX + 2, benchY + 8, 22, 4);
    ctx.fillStyle = '#334155';
    ctx.fillRect(benchX, benchY + 4, 3, 10);
    ctx.fillRect(benchX + 23, benchY + 4, 3, 10);

    // Right Lawn: Outdoor reading kiosk / book tree cart
    const kioskX = bx + bw - 26;
    const kioskY = by + bh - 28;
    ctx.fillStyle = '#00000033';
    ctx.fillRect(kioskX, kioskY + 16, 18, 4);
    ctx.fillStyle = '#B45309';
    ctx.fillRect(kioskX + 2, kioskY - 2, 14, 18);
    ctx.fillStyle = '#DC2626'; // Little pitched roof
    ctx.beginPath();
    ctx.moveTo(kioskX, kioskY - 2);
    ctx.lineTo(kioskX + 9, kioskY - 8);
    ctx.lineTo(kioskX + 18, kioskY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FEF3C7'; // Open book display
    ctx.fillRect(kioskX + 4, kioskY + 2, 10, 10);
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(kioskX + 6, kioskY + 5, 6, 2);

    // 7. Classical Carved Oak Entrance (Facing South)
    const doorX = bx + bw / 2 - 24;
    const doorY = by + bh - 58;

    if (isNearby) {
      const doorGlow = (Math.sin(time * 0.008) + 1) * 0.5;
      ctx.fillStyle = `rgba(251, 191, 36, ${0.15 + doorGlow * 0.2})`;
      ctx.fillRect(doorX - 10, doorY - 8, 68, 70);
    }

    // Arched Stone Doorway
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(doorX + 24, doorY + 6, 26, Math.PI, 0);
    ctx.fillRect(doorX - 2, doorY + 6, 52, 48);
    ctx.fill();

    // Solid Oak Double Doors
    ctx.fillStyle = '#78350F';
    ctx.fillRect(doorX + 2, doorY + 4, 44, 50);
    // Door panel inserts
    ctx.fillStyle = '#451A03';
    ctx.fillRect(doorX + 5, doorY + 8, 17, 20);
    ctx.fillRect(doorX + 26, doorY + 8, 17, 20);
    ctx.fillRect(doorX + 5, doorY + 32, 17, 18);
    ctx.fillRect(doorX + 26, doorY + 32, 17, 18);
    // Brass door handles
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(doorX + 19, doorY + 26, 2, 6);
    ctx.fillRect(doorX + 27, doorY + 26, 2, 6);

    // Flagstone Steps
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(doorX - 8, by + bh - 6, 64, 6);
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(doorX - 6, by + bh - 2, 60, 4);

    // Wall Hanging Carriage Lanterns
    const drawLibraryLantern = (lx: number, ly: number) => {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(lx, ly, 6, 12);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(lx + 1, ly + 3, 4, 7);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.beginPath();
      ctx.ellipse(lx + 3, ly + 6, 16, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawLibraryLantern(doorX - 12, doorY + 16);
    drawLibraryLantern(doorX + 54, doorY + 16);

    // 8. Classical Wooden Signboard
    const signW = 196;
    const signH = 24;
    const signX = bx + bw / 2 - signW / 2;
    const signY = by + 34;

    ctx.fillStyle = '#451A03F2';
    ctx.fillRect(signX, signY, signW, signH);
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(signX, signY, signW, signH);

    ctx.fillStyle = '#FEF3C7';
    ctx.font = `bold 11px ${uiFontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('📚 THƯ VIỆN TRI THỨC KHTN', bx + bw / 2, signY + 16);
  };

  const drawStemLab = (ctx: CanvasRenderingContext2D, b: BuildingInfo, time: number) => {
    const bx = b.x * TILE_SIZE;
    const by = b.y * TILE_SIZE;
    const bw = b.width * TILE_SIZE;
    const bh = b.height * TILE_SIZE;
    const isNearby = nearbyBuilding?.id === b.id;

    // 1. Soft Ambient Ground Shadow
    ctx.fillStyle = '#0000003D';
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + bh + 4, bw / 2 + 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. High-Tech Composite Base Plinth
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(bx - 4, by + bh - 16, bw + 8, 16);
    // Neon Teal Base Ground Illumination Trim
    ctx.fillStyle = '#0D9488';
    ctx.fillRect(bx - 4, by + bh - 18, bw + 8, 2);

    // 3. Multi-Layer Modular Architectural Facade
    // Main Research Facility Wall: Clean Titanium White Panels with subtle slate joints
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(bx, by + 36, bw, bh - 52);

    // Facade Panel Seams (Grid pattern giving architectural paneling feel)
    ctx.fillStyle = '#CBD5E1';
    for (let px = bx + 48; px < bx + bw; px += 48) {
      ctx.fillRect(px, by + 36, 1, bh - 52);
    }
    for (let py = by + 68; py < by + bh - 20; py += 32) {
      ctx.fillRect(bx, py, bw, 1);
    }

    // Left and Right High-Tech Structural Pilasters / Reinforcement Wings
    ctx.fillStyle = '#042F2E'; // Deep Obsidian Teal
    ctx.fillRect(bx, by + 36, 28, bh - 52);
    ctx.fillRect(bx + bw - 28, by + 36, 28, bh - 52);

    // Cyan Status Light Strips along pilasters
    const pulse1 = (Math.sin(time * 0.004) + 1) * 0.5;
    ctx.fillStyle = `rgba(45, 212, 191, ${0.4 + pulse1 * 0.5})`;
    ctx.fillRect(bx + 12, by + 44, 4, bh - 68);
    ctx.fillRect(bx + bw - 16, by + 44, 4, bh - 68);

    // 4. Roof Architecture: Angled Glass Aerodynamic Canopy & Solar Photovoltaic Grid
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.moveTo(bx - 8, by + 36);
    ctx.lineTo(bx + bw / 2, by + 4);
    ctx.lineTo(bx + bw + 8, by + 36);
    ctx.closePath();
    ctx.fill();

    // Solar PV Glass Panels with crisp grid
    ctx.fillStyle = '#0284C7';
    for (let s = 0; s < 4; s++) {
      const sw = 44;
      const sx = bx + 36 + s * 70;
      const sy = by + 16;
      ctx.fillRect(sx, sy, sw, 16);
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, sw, 16);
      // Solar cell cross lines
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(sx + sw / 2, sy, 1, 16);
      ctx.fillRect(sx, sy + 8, sw, 1);
    }

    // Central Green Research Biosphere Dome on Rooftop
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + 18, 38, 22, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing Hydroponic / Chemical Culture inside Dome
    const bioGlow = (Math.sin(time * 0.005) + 1) * 0.5;
    ctx.fillStyle = `rgba(52, 211, 153, ${0.4 + bioGlow * 0.4})`;
    ctx.beginPath();
    ctx.arc(bx + bw / 2, by + 18, 14, 0, Math.PI * 2);
    ctx.fill();

    // Rooftop Communications & Satellite Weather Spire
    ctx.fillStyle = '#64748B';
    ctx.fillRect(bx + bw / 2 - 2, by - 18, 4, 22);
    ctx.fillStyle = '#0D9488';
    ctx.beginPath();
    ctx.arc(bx + bw / 2, by - 18, 4, 0, Math.PI * 2);
    ctx.fill();
    // Blinking green beacon
    if (Math.floor(time * 0.004) % 2 === 0) {
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.arc(bx + bw / 2, by - 18, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Large Multi-Pane Laboratory Windows with Real Scientific Equipment Silhouettes
    const drawLabWindow = (wx: number, wy: number, type: 'chemistry' | 'physics') => {
      // Window frame
      ctx.fillStyle = '#0D9488';
      ctx.fillRect(wx - 2, wy - 2, 58, 46);
      // Interior warm illumination
      ctx.fillStyle = '#134E4A';
      ctx.fillRect(wx, wy, 54, 42);
      ctx.fillStyle = 'rgba(204, 251, 241, 0.25)';
      ctx.fillRect(wx, wy, 54, 42);

      if (type === 'chemistry') {
        // Chemistry Flasks and Beakers silhouette
        // Shelf
        ctx.fillStyle = '#115E59';
        ctx.fillRect(wx + 4, wy + 24, 46, 3);
        // Beaker with boiling fluid
        ctx.fillStyle = '#A7F3D0';
        ctx.fillRect(wx + 8, wy + 14, 10, 10);
        ctx.fillStyle = '#10B981';
        ctx.fillRect(wx + 9, wy + 18, 8, 6);
        // Distillation flask
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(wx + 28, wy + 18, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(wx + 26, wy + 10, 4, 8);
        // Microscope silhouette
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(wx + 40, wy + 12, 6, 12);
        ctx.fillRect(wx + 38, wy + 21, 10, 3);
      } else {
        // Electronics / Physics console
        ctx.fillStyle = '#115E59';
        ctx.fillRect(wx + 4, wy + 24, 46, 3);
        // Glowing monitor screen
        const screenPulse = Math.sin(time * 0.006) > 0 ? '#38BDF8' : '#818CF8';
        ctx.fillStyle = screenPulse;
        ctx.fillRect(wx + 8, wy + 10, 16, 12);
        // Oscilloscope wave
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(wx + 10, wy + 16);
        ctx.lineTo(wx + 14, wy + 12);
        ctx.lineTo(wx + 18, wy + 18);
        ctx.lineTo(wx + 22, wy + 16);
        ctx.stroke();
        // Server rack blinkers
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(wx + 34, wy + 8, 14, 16);
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(wx + 36, wy + 11, 2, 2);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(wx + 36, wy + 16, 2, 2);
      }

      // Glass Panes Grids
      ctx.strokeStyle = '#042F2E';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx, wy, 54, 42);
      ctx.beginPath();
      ctx.moveTo(wx + 27, wy);
      ctx.lineTo(wx + 27, wy + 42);
      ctx.moveTo(wx, wy + 21);
      ctx.lineTo(wx + 54, wy + 21);
      ctx.stroke();
    };

    drawLabWindow(bx + 40, by + 60, 'chemistry');
    drawLabWindow(bx + bw - 98, by + 60, 'physics');

    // 6. Outdoor Sci-Fi Props: Friendly Research Robot "STEM-E" on Left Lawn
    const botX = bx + 16;
    const botY = by + bh - 24;
    // Shadow
    ctx.fillStyle = '#00000033';
    ctx.beginPath();
    ctx.ellipse(botX + 8, botY + 14, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Robot base wheels
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(botX + 2, botY + 8, 12, 6);
    // Robot body
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(botX + 1, botY - 4, 14, 12);
    // Chest meter
    ctx.fillStyle = '#E0F2FE';
    ctx.fillRect(botX + 4, botY - 1, 8, 5);
    // Head with antenna
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(botX + 3, botY - 12, 10, 8);
    // Antenna
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(botX + 7, botY - 18, 2, 6);
    const antPulse = Math.floor(time * 0.005) % 2 === 0 ? '#4ADE80' : '#F43F5E';
    ctx.fillStyle = antPulse;
    ctx.beginPath();
    ctx.arc(botX + 8, botY - 18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Visor eye
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(botX + 5, botY - 9, 6, 3);
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(botX + 6, botY - 8, 4, 2);

    // Outdoor Sci-Fi Prop: Distillation Energy Column on Right Lawn
    const colX = bx + bw - 22;
    const colY = by + bh - 26;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(colX, colY - 16, 12, 30);
    ctx.fillStyle = '#0D9488';
    ctx.fillRect(colX + 2, colY - 12, 8, 24);
    // Bubbles
    const b1 = (time * 0.02) % 20;
    ctx.fillStyle = '#CCFBF1';
    ctx.beginPath();
    ctx.arc(colX + 6, colY + 10 - b1, 2, 0, Math.PI * 2);
    ctx.fill();

    // 7. Hi-Tech Main Entrance (Facing South)
    const doorX = bx + bw / 2 - 26;
    const doorY = by + bh - 58;

    // Entrance Proximity Aura / Glow
    if (isNearby) {
      const doorGlow = (Math.sin(time * 0.008) + 1) * 0.5;
      ctx.fillStyle = `rgba(45, 212, 191, ${0.15 + doorGlow * 0.2})`;
      ctx.fillRect(doorX - 10, doorY - 8, 72, 70);
    }

    // Outer Door Archway Frame
    ctx.fillStyle = '#042F2E';
    ctx.fillRect(doorX - 4, doorY - 4, 60, 58);
    ctx.fillStyle = '#0D9488';
    ctx.strokeRect(doorX - 4, doorY - 4, 60, 58);

    // Sliding Double Glass Doors
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(doorX, doorY, 52, 54);
    // Cyan tinted safety glass panels
    ctx.fillStyle = '#14B8A6';
    ctx.fillRect(doorX + 3, doorY + 4, 22, 44);
    ctx.fillRect(doorX + 27, doorY + 4, 22, 44);
    // Glass reflex highlights
    ctx.fillStyle = '#99F6E4';
    ctx.fillRect(doorX + 5, doorY + 6, 4, 40);
    ctx.fillRect(doorX + 29, doorY + 6, 4, 40);

    // Metal Grid Stone Steps
    ctx.fillStyle = '#475569';
    ctx.fillRect(doorX - 8, by + bh - 6, 68, 6);
    ctx.fillStyle = '#64748B';
    ctx.fillRect(doorX - 6, by + bh - 2, 64, 4);

    // Flanking Hi-Tech Exterior Science Wall Sconces
    const drawScienceSconce = (lx: number, ly: number) => {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(lx, ly, 6, 12);
      ctx.fillStyle = '#2DD4BF';
      ctx.fillRect(lx + 1, ly + 2, 4, 8);
      // Soft light pool
      ctx.fillStyle = 'rgba(45, 212, 191, 0.2)';
      ctx.beginPath();
      ctx.ellipse(lx + 3, ly + 6, 14, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawScienceSconce(doorX - 14, doorY + 16);
    drawScienceSconce(doorX + 60, doorY + 16);

    // Lock Status on Door
    const lockCheck = ProgressionSystem.isBuildingUnlocked(b.id, progress);
    if (!lockCheck.unlocked) {
      drawLockBadge(ctx, doorX + 26, doorY + 26);
    }

    // 8. Sleek Integrated Architectural Signboard
    const signW = 200;
    const signH = 24;
    const signX = bx + bw / 2 - signW / 2;
    const signY = by + 34;

    ctx.fillStyle = '#042F2EF2';
    ctx.fillRect(signX, signY, signW, signH);
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(signX, signY, signW, signH);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 11px ${uiFontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('🧪 PHÒNG THÍ NGHIỆM STEM', bx + bw / 2, signY + 16);
  };

  const drawQuizArcade = (ctx: CanvasRenderingContext2D, b: BuildingInfo, time: number) => {
    const bx = b.x * TILE_SIZE;
    const by = b.y * TILE_SIZE;
    const bw = b.width * TILE_SIZE;
    const bh = b.height * TILE_SIZE;
    const isNearby = nearbyBuilding?.id === b.id;

    // 1. Drop Shadow
    ctx.fillStyle = '#0000003D';
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + bh + 4, bw / 2 + 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Neon-Trimmed Indigo Foundation
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(bx, by + 32, bw, bh - 32);
    // Cyan Neon Base Strip
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(bx, by + bh - 4, bw, 4);

    // 3. Purple Masonry & Glowing Neon Pilasters
    ctx.fillStyle = '#4C1D95';
    ctx.fillRect(bx + 4, by + 36, bw - 8, bh - 42);

    // Cyan/Magenta Neon Wall Trims
    const neonPulse = (Math.sin(time * 0.006) + 1) * 0.5;
    ctx.fillStyle = `rgba(236, 72, 153, ${0.4 + neonPulse * 0.5})`;
    ctx.fillRect(bx + 18, by + 40, 4, bh - 50);
    ctx.fillRect(bx + bw - 22, by + 40, 4, bh - 50);

    // 4. Multi-Tiered Marquee Roof Awning with Chaser Bulbs
    ctx.fillStyle = '#7C3AED';
    ctx.beginPath();
    ctx.moveTo(bx - 10, by + 32);
    ctx.lineTo(bx + 20, by + 8);
    ctx.lineTo(bx + bw - 20, by + 8);
    ctx.lineTo(bx + bw + 10, by + 32);
    ctx.closePath();
    ctx.fill();

    // Animated Neon Chaser Bulbs along the awning
    const bulbStep = Math.floor(time * 0.008) % 3;
    for (let i = 0; i < 11; i++) {
      const bulbColor =
        (i + bulbStep) % 3 === 0 ? '#F43F5E' : (i + bulbStep) % 3 === 1 ? '#06B6D4' : '#FBBF24';
      ctx.fillStyle = bulbColor;
      ctx.beginPath();
      ctx.arc(bx + 22 + i * 26, by + 20, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Arcade Showcase Windows with Visible Retro Arcade Game Cabinets
    const drawArcadeCabinetWindow = (wx: number, wy: number, gameType: 'quiz' | 'space') => {
      // Outer cabinet window frame
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(wx - 2, wy - 2, 48, 54);
      ctx.fillStyle = '#2E1065';
      ctx.fillRect(wx, wy, 44, 50);

      // Arcade Cabinet silhouette inside
      ctx.fillStyle = gameType === 'quiz' ? '#1E1B4B' : '#0369A1';
      ctx.fillRect(wx + 8, wy + 8, 28, 38);

      // Glowing CRT Screen
      const crtFlicker = 0.8 + Math.sin(time * 0.015) * 0.2;
      ctx.fillStyle = gameType === 'quiz' ? `rgba(6, 182, 212, ${crtFlicker})` : `rgba(236, 72, 153, ${crtFlicker})`;
      ctx.fillRect(wx + 12, wy + 14, 20, 16);

      // Pixel game graphics on CRT screen
      ctx.fillStyle = '#FFFFFF';
      if (gameType === 'quiz') {
        // Question mark & lightning
        ctx.fillRect(wx + 20, wy + 18, 4, 2);
        ctx.fillRect(wx + 22, wy + 20, 2, 4);
        ctx.fillRect(wx + 22, wy + 26, 2, 2);
      } else {
        // Space Invader pixel alien
        ctx.fillRect(wx + 18, wy + 19, 8, 2);
        ctx.fillRect(wx + 16, wy + 21, 12, 3);
        ctx.fillRect(wx + 19, wy + 24, 2, 2);
        ctx.fillRect(wx + 23, wy + 24, 2, 2);
      }

      // Joystick & buttons panel
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(wx + 10, wy + 32, 24, 6);
      ctx.fillStyle = '#EF4444'; // Red joystick ball
      ctx.fillRect(wx + 14, wy + 30, 3, 3);
      ctx.fillStyle = '#FBBF24'; // Yellow buttons
      ctx.fillRect(wx + 24, wy + 33, 2, 2);
      ctx.fillRect(wx + 28, wy + 33, 2, 2);

      // Window neon border
      ctx.strokeStyle = gameType === 'quiz' ? '#06B6D4' : '#F43F5E';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx, wy, 44, 50);
    };

    drawArcadeCabinetWindow(bx + 24, by + 52, 'quiz');
    drawArcadeCabinetWindow(bx + bw - 68, by + 52, 'space');

    // 6. Main Double Arcade Glass Doors (North Facing)
    const doorX = bx + bw / 2 - 26;
    const doorY = by + 36;

    if (isNearby) {
      const doorGlow = (Math.sin(time * 0.008) + 1) * 0.5;
      ctx.fillStyle = `rgba(168, 85, 247, ${0.2 + doorGlow * 0.25})`;
      ctx.fillRect(doorX - 10, doorY - 10, 72, 68);
    }

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(doorX - 3, doorY - 3, 58, 52);
    ctx.fillStyle = '#3B0764';
    ctx.fillRect(doorX, doorY, 52, 46);

    // Glass reflex
    ctx.fillStyle = '#7C3AED';
    ctx.fillRect(doorX + 3, doorY + 3, 22, 40);
    ctx.fillRect(doorX + 27, doorY + 3, 22, 40);
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(doorX + 3, doorY + 3, 46, 40);

    // Retro Checkered Threshold Mat
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(doorX - 6, doorY - 6, 64, 6);
    for (let c = 0; c < 8; c++) {
      ctx.fillStyle = c % 2 === 0 ? '#EC4899' : '#06B6D4';
      ctx.fillRect(doorX - 4 + c * 8, doorY - 5, 8, 4);
    }

    // 7. Integrated Illuminated Arcade Marquee Signboard
    const signW = 200;
    const signH = 24;
    const signX = bx + bw / 2 - signW / 2;
    const signY = by + 4;

    ctx.fillStyle = '#1E1B4BF5';
    ctx.fillRect(signX, signY, signW, signH);
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(signX, signY, signW, signH);

    ctx.fillStyle = '#FDF4FF';
    ctx.font = `bold 11px ${uiFontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('⚡ ĐẤU TRƯỜNG QUIZ ARCADE', bx + bw / 2, signY + 16);
  };

  const drawReviewStation = (ctx: CanvasRenderingContext2D, b: BuildingInfo, time: number) => {
    const bx = b.x * TILE_SIZE;
    const by = b.y * TILE_SIZE;
    const bw = b.width * TILE_SIZE;
    const bh = b.height * TILE_SIZE;
    const isNearby = nearbyBuilding?.id === b.id;

    // Ground Drop shadow
    ctx.fillStyle = '#00000033';
    ctx.fillRect(bx + 6, by + bh - 6, bw, 18);

    // 1. Stone Ashlar Foundation Plinth (Base wall)
    ctx.fillStyle = '#44403C';
    ctx.fillRect(bx, by + 32, bw, bh - 32);
    ctx.fillStyle = '#57534E';
    ctx.fillRect(bx + 2, by + bh - 24, bw - 4, 22);

    // Foundation stone vertical mortar lines
    ctx.fillStyle = '#292524';
    for (let s = 0; s < 6; s++) {
      ctx.fillRect(bx + 20 + s * 48, by + bh - 24, 2, 22);
    }

    // 2. Warm Red-Brown Brick Workshop Facade
    ctx.fillStyle = '#9A3412'; // Rich brick terracotta
    ctx.fillRect(bx + 4, by + 34, bw - 8, bh - 56);

    // Horizontal Brick Mortar Lines
    ctx.fillStyle = '#7C2D1244';
    for (let row = 0; row < 7; row++) {
      ctx.fillRect(bx + 4, by + 40 + row * 10, bw - 8, 1.5);
    }

    // Vertical Exposed Timber Framing Posts
    ctx.fillStyle = '#451A03';
    ctx.fillRect(bx + 4, by + 34, 12, bh - 56);
    ctx.fillRect(bx + bw - 16, by + 34, 12, bh - 56);

    // 3. Multi-Layered Pitched Workshop Roof with Overhang
    // Main roof pitch
    ctx.fillStyle = '#C2410C'; // Warm copper-orange roof tiles
    ctx.beginPath();
    ctx.moveTo(bx - 10, by + 32);
    ctx.lineTo(bx + 16, by + 6);
    ctx.lineTo(bx + bw - 16, by + 6);
    ctx.lineTo(bx + bw + 10, by + 32);
    ctx.closePath();
    ctx.fill();

    // Shingle Tile Rows
    ctx.strokeStyle = '#9A3412';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx - 4, by + 24);
    ctx.lineTo(bx + bw + 4, by + 24);
    ctx.moveTo(bx + 4, by + 16);
    ctx.lineTo(bx + bw - 4, by + 16);
    ctx.stroke();

    // Roof Eave Highlight & Shadow Overhang
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(bx - 10, by + 30, bw + 20, 4);
    ctx.fillStyle = '#43140766';
    ctx.fillRect(bx - 4, by + 34, bw + 8, 4);

    // Brick Chimney on the Right Side of Roof
    const chimX = bx + bw - 38;
    const chimY = by - 8;
    ctx.fillStyle = '#7C2D12';
    ctx.fillRect(chimX, chimY, 14, 24);
    ctx.fillStyle = '#451A03';
    ctx.fillRect(chimX - 2, chimY - 2, 18, 4);

    // Chimney subtle steam particle
    const steamY = ((time * 0.02) % 18);
    ctx.fillStyle = 'rgba(245, 245, 244, 0.4)';
    ctx.beginPath();
    ctx.arc(chimX + 7, chimY - 6 - steamY, 3 + steamY * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Two Workshop Casement Windows with Warm Amber Glow
    const drawWorkshopWindow = (wx: number, wy: number) => {
      // Outer Wooden Trim
      ctx.fillStyle = '#451A03';
      ctx.fillRect(wx - 2, wy - 2, 38, 40);

      // Glass with warm interior tungsten/amber light
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(wx, wy, 34, 36);

      // Window panes (6-pane grid)
      ctx.fillStyle = '#78350F';
      ctx.fillRect(wx + 16, wy, 2, 36);
      ctx.fillRect(wx, wy + 17, 34, 2);

      // Wooden windowsill
      ctx.fillStyle = '#78350F';
      ctx.fillRect(wx - 4, wy + 36, 42, 4);

      // Specular reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(wx + 2, wy + 2);
      ctx.lineTo(wx + 10, wy + 2);
      ctx.lineTo(wx + 2, wy + 12);
      ctx.closePath();
      ctx.fill();
    };

    drawWorkshopWindow(bx + 24, by + 50);
    drawWorkshopWindow(bx + bw - 60, by + 50);

    // 5. Craftsman Double Workshop Entrance Doors (North Facing)
    const doorX = bx + bw / 2 - 25;
    const doorY = by + 36;

    if (isNearby) {
      const doorGlow = (Math.sin(time * 0.008) + 1) * 0.5;
      ctx.fillStyle = `rgba(249, 115, 22, ${0.2 + doorGlow * 0.25})`;
      ctx.fillRect(doorX - 10, doorY - 10, 70, 68);
    }

    ctx.fillStyle = '#292524'; // Door Frame
    ctx.fillRect(doorX - 3, doorY - 3, 56, 52);

    // Wooden Double Doors
    ctx.fillStyle = '#78350F';
    ctx.fillRect(doorX, doorY, 50, 48);

    // Door center seam & wooden vertical planks
    ctx.fillStyle = '#451A03';
    ctx.fillRect(doorX + 24, doorY, 2, 48);
    ctx.fillRect(doorX + 11, doorY, 1, 48);
    ctx.fillRect(doorX + 37, doorY, 1, 48);

    // Brass Door Handles
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(doorX + 20, doorY + 24, 3, 5);
    ctx.fillRect(doorX + 27, doorY + 24, 3, 5);

    // Transom Window above door
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(doorX + 4, doorY + 4, 42, 10);
    ctx.fillStyle = '#451A03';
    ctx.fillRect(doorX + 24, doorY + 4, 2, 10);

    // Stone Steps & Welcome Mat in front of door
    ctx.fillStyle = '#A8A29E';
    ctx.fillRect(doorX - 6, doorY - 4, 62, 5);
    ctx.fillStyle = '#B45309';
    ctx.fillRect(doorX + 4, doorY - 3, 42, 4);

    // 6. Rotating Gear / Clockwork Insignia above Door
    const gearRot = time * 0.002;
    ctx.save();
    ctx.translate(bx + bw / 2, by + 22);
    ctx.rotate(gearRot);
    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7C2D12';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    // Gear teeth
    ctx.fillStyle = '#FDBA74';
    for (let g = 0; g < 6; g++) {
      ctx.rotate(Math.PI / 3);
      ctx.fillRect(-2, -16, 4, 4);
    }
    ctx.restore();

    // 7. Exterior Workshop Details: Wall Lantern beside door
    const lanternX = doorX - 10;
    const lanternY = doorY + 18;
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(lanternX, lanternY, 4, 6);
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(lanternX + 2, lanternY + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    // Warm radial glow
    ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
    ctx.beginPath();
    ctx.arc(lanternX + 2, lanternY + 3, 10, 0, Math.PI * 2);
    ctx.fill();

    // Lock badge if locked
    const lockCheck = ProgressionSystem.isBuildingUnlocked(b.id, progress);
    if (!lockCheck.unlocked) {
      drawLockBadge(ctx, doorX + 25, doorY + 25);
    }

    // 8. Integrated Workshop Wooden Signboard
    const signW = 196;
    const signH = 24;
    const signX = bx + bw / 2 - signW / 2;
    const signY = by + 2;

    ctx.fillStyle = '#451A03F2';
    ctx.fillRect(signX, signY, signW, signH);
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(signX, signY, signW, signH);

    ctx.fillStyle = '#FFEDD5';
    ctx.font = `bold 11px ${uiFontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('🛠️ TRẠM SỬA LỖI CỨU NGUY', bx + bw / 2, signY + 16);
  };

  const drawAchievementPlaza = (ctx: CanvasRenderingContext2D, b: BuildingInfo, time: number) => {
    const bx = b.x * TILE_SIZE;
    const by = b.y * TILE_SIZE;
    const bw = b.width * TILE_SIZE;
    const bh = b.height * TILE_SIZE;
    const isNearby = nearbyBuilding?.id === b.id;

    ctx.fillStyle = '#00000033';
    ctx.fillRect(bx + 8, by + bh - 6, bw, 18);

    // Golden Marble Colonnade Pavilion
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(bx, by + 32, bw, bh - 32);

    // Classical Golden Roof Cornice with Laurel Motifs
    ctx.fillStyle = '#D97706';
    ctx.fillRect(bx - 6, by + 14, bw + 12, 20);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(bx - 4, by + 16, bw + 8, 4);

    // Central Golden Trophy Statue on Plinth with Sparkle
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(bx + bw / 2 - 18, by + 48, 36, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', bx + bw / 2, by + 78);

    // Star sparkle glint on trophy
    if (Math.floor(time * 0.003) % 2 === 0) {
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(bx + bw / 2 + 8, by + 58, 3, 3);
      ctx.fillRect(bx + bw / 2 + 7, by + 57, 5, 1);
      ctx.fillRect(bx + bw / 2 + 7, by + 59, 5, 1);
    }

    // Fluted Marble Columns
    ctx.fillStyle = '#FDE68A';
    for (let c = 0; c < 4; c++) {
      ctx.fillRect(bx + 20 + c * 72, by + 34, 16, bh - 34);
    }

    // Red Carpet Entrance Runner (North Facing)
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(bx + bw / 2 - 20, by + 32, 40, bh - 32);

    if (isNearby) {
      const plazaGlow = (Math.sin(time * 0.008) + 1) * 0.5;
      ctx.fillStyle = `rgba(251, 191, 36, ${0.15 + plazaGlow * 0.2})`;
      ctx.fillRect(bx + bw / 2 - 24, by + 28, 48, bh - 24);
    }

    // 8. Integrated Golden Honor Signboard
    const signW = 196;
    const signH = 24;
    const signX = bx + bw / 2 - signW / 2;
    const signY = by + 4;

    ctx.fillStyle = '#78350FF2';
    ctx.fillRect(signX, signY, signW, signH);
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(signX, signY, signW, signH);

    ctx.fillStyle = '#FFFBEB';
    ctx.font = `bold 11px ${uiFontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('🏆 QUẢNG TRƯỜNG VINH DANH', bx + bw / 2, signY + 16);
  };

  const drawVirtualLab = (ctx: CanvasRenderingContext2D, b: BuildingInfo, time: number) => {
    const bx = b.x * TILE_SIZE;
    const by = b.y * TILE_SIZE;
    const bw = b.width * TILE_SIZE;
    const bh = b.height * TILE_SIZE;
    const isNearby = nearbyBuilding?.id === b.id;

    // Drop Shadow
    ctx.fillStyle = '#0000003D';
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + bh + 4, bw / 2 + 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark brown foundation
    ctx.fillStyle = '#7C2D12';
    ctx.fillRect(bx, by + 32, bw, bh - 32);

    // Orange accent base strip
    ctx.fillStyle = '#F97316';
    ctx.fillRect(bx, by + bh - 4, bw, 4);

    // Inner wall — warm brown lab interior
    ctx.fillStyle = '#9A3412';
    ctx.fillRect(bx + 4, by + 36, bw - 8, bh - 42);

    // Hazard stripe accents on pillars
    ctx.fillStyle = '#F97316';
    ctx.fillRect(bx + 4, by + 36, 8, bh - 42);
    ctx.fillRect(bx + bw - 12, by + 36, 8, bh - 42);
    ctx.fillStyle = '#7C2D12';
    for (let s = 0; s < 6; s++) {
      ctx.fillRect(bx + 4, by + 40 + s * 14, 8, 4);
      ctx.fillRect(bx + bw - 12, by + 40 + s * 14, 8, 4);
    }

    // Sloped lab roof
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.moveTo(bx - 10, by + 32);
    ctx.lineTo(bx + 16, by + 6);
    ctx.lineTo(bx + bw - 16, by + 6);
    ctx.lineTo(bx + bw + 10, by + 32);
    ctx.closePath();
    ctx.fill();

    // Roof eave
    ctx.fillStyle = '#C2410C';
    ctx.fillRect(bx - 10, by + 30, bw + 20, 4);

    // Skylight on roof
    ctx.fillStyle = '#FED7AA';
    ctx.fillRect(bx + bw / 2 - 20, by + 14, 40, 12);
    ctx.strokeStyle = '#7C2D12';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + bw / 2 - 20, by + 14, 40, 12);
    ctx.fillStyle = '#7C2D12';
    ctx.fillRect(bx + bw / 2, by + 14, 1.5, 12);

    // Lab windows with green bubbling liquid glow
    const drawLabWindow = (wx: number, wy: number) => {
      ctx.fillStyle = '#451A03';
      ctx.fillRect(wx - 2, wy - 2, 40, 42);
      ctx.fillStyle = '#064E3B';
      ctx.fillRect(wx, wy, 36, 38);
      // Bubbling liquid
      const bubblePhase = (time * 0.004 + wx) % 20;
      ctx.fillStyle = '#34D399';
      ctx.beginPath();
      ctx.arc(wx + 12, wy + 30 - bubblePhase, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx + 24, wy + 34 - (bubblePhase * 0.7), 2, 0, Math.PI * 2);
      ctx.fill();
      // Flask silhouette
      ctx.fillStyle = '#10B981';
      ctx.fillRect(wx + 14, wy + 18, 8, 16);
      ctx.fillRect(wx + 12, wy + 28, 12, 6);
      ctx.fillRect(wx + 16, wy + 14, 4, 4);
      // Window frame cross
      ctx.fillStyle = '#451A03';
      ctx.fillRect(wx + 17, wy, 2, 38);
      ctx.fillRect(wx, wy + 18, 36, 2);
    };

    drawLabWindow(bx + 20, by + 48);
    drawLabWindow(bx + bw - 58, by + 48);

    // Entrance door (north facing)
    const doorX = bx + bw / 2 - 24;
    const doorY = by + 36;

    if (isNearby) {
      const doorGlow = (Math.sin(time * 0.008) + 1) * 0.5;
      ctx.fillStyle = `rgba(249, 115, 22, ${0.2 + doorGlow * 0.25})`;
      ctx.fillRect(doorX - 10, doorY - 10, 68, 66);
    }

    ctx.fillStyle = '#292524';
    ctx.fillRect(doorX - 3, doorY - 3, 54, 50);
    ctx.fillStyle = '#7C2D12';
    ctx.fillRect(doorX, doorY, 48, 44);
    // Door glass panels
    ctx.fillStyle = '#FED7AA';
    ctx.fillRect(doorX + 4, doorY + 4, 18, 36);
    ctx.fillRect(doorX + 26, doorY + 4, 18, 36);
    // Door handles
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(doorX + 20, doorY + 22, 3, 5);
    ctx.fillRect(doorX + 25, doorY + 22, 3, 5);

    // Microscope icon above door
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔬', bx + bw / 2, by + 26);

    // Lock badge
    const lockCheck = ProgressionSystem.isBuildingUnlocked(b.id, progress);
    if (!lockCheck.unlocked) {
      drawLockBadge(ctx, doorX + 24, doorY + 22);
    }

    // Signboard
    const signW = 200;
    const signH = 24;
    const signX = bx + bw / 2 - signW / 2;
    const signY = by + 2;

    ctx.fillStyle = '#7C2D12F2';
    ctx.fillRect(signX, signY, signW, signH);
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(signX, signY, signW, signH);

    ctx.fillStyle = '#FED7AA';
    ctx.font = `bold 11px ${uiFontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('🔬 PHÒNG THÍ NGHIỆM ẢO', bx + bw / 2, signY + 16);
  };

  const drawWorld3D = (ctx: CanvasRenderingContext2D, b: BuildingInfo, time: number) => {
    const bx = b.x * TILE_SIZE;
    const by = b.y * TILE_SIZE;
    const bw = b.width * TILE_SIZE;
    const bh = b.height * TILE_SIZE;
    const isNearby = nearbyBuilding?.id === b.id;

    // Drop Shadow
    ctx.fillStyle = '#0000003D';
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + bh + 4, bw / 2 + 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deep navy foundation
    ctx.fillStyle = '#1E3A5F';
    ctx.fillRect(bx, by + 32, bw, bh - 32);

    // Cyan neon base strip
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(bx, by + bh - 4, bw, 4);

    // Inner wall — dark tech panel
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(bx + 4, by + 36, bw - 8, bh - 42);

    // Vertical cyan accent lines (tech look)
    const cyanPulse = (Math.sin(time * 0.005) + 1) * 0.5;
    ctx.fillStyle = `rgba(6, 182, 212, ${0.3 + cyanPulse * 0.4})`;
    ctx.fillRect(bx + 16, by + 40, 3, bh - 50);
    ctx.fillRect(bx + bw - 19, by + 40, 3, bh - 50);

    // Futuristic dome roof
    ctx.fillStyle = '#164E63';
    ctx.beginPath();
    ctx.moveTo(bx - 8, by + 32);
    ctx.quadraticCurveTo(bx + bw / 2, by - 10, bx + bw + 8, by + 32);
    ctx.closePath();
    ctx.fill();

    // Dome highlight
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + 10, by + 28);
    ctx.quadraticCurveTo(bx + bw / 2, by - 4, bx + bw - 10, by + 28);
    ctx.stroke();

    // Rotating holographic globe on dome
    const globeX = bx + bw / 2;
    const globeY = by + 10;
    const globeR = 14;
    ctx.fillStyle = `rgba(6, 182, 212, ${0.5 + cyanPulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(globeX, globeY, globeR, 0, Math.PI * 2);
    ctx.fill();
    // Grid lines on globe
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 1;
    const rot = time * 0.002;
    for (let i = -1; i <= 1; i++) {
      const offset = Math.sin(rot + i) * 8;
      ctx.beginPath();
      ctx.ellipse(globeX + offset, globeY, 4, globeR - 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(globeX, globeY, globeR - 2, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Globe glow
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.beginPath();
    ctx.arc(globeX, globeY, globeR + 8, 0, Math.PI * 2);
    ctx.fill();

    // Holographic display windows
    const drawHoloWindow = (wx: number, wy: number, shape: '3d' | 'wave') => {
      ctx.fillStyle = '#0C4A6E';
      ctx.fillRect(wx - 2, wy - 2, 44, 46);
      ctx.fillStyle = '#083344';
      ctx.fillRect(wx, wy, 40, 42);

      // Holographic content
      const flicker = 0.7 + Math.sin(time * 0.01 + wx) * 0.3;
      ctx.fillStyle = `rgba(34, 211, 238, ${flicker})`;
      if (shape === '3d') {
        // 3D cube wireframe
        ctx.strokeStyle = `rgba(34, 211, 238, ${flicker})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(wx + 10, wy + 10, 16, 16);
        ctx.strokeRect(wx + 16, wy + 6, 16, 16);
        ctx.beginPath();
        ctx.moveTo(wx + 10, wy + 10); ctx.lineTo(wx + 16, wy + 6);
        ctx.moveTo(wx + 26, wy + 10); ctx.lineTo(wx + 32, wy + 6);
        ctx.moveTo(wx + 10, wy + 26); ctx.lineTo(wx + 16, wy + 22);
        ctx.moveTo(wx + 26, wy + 26); ctx.lineTo(wx + 32, wy + 22);
        ctx.stroke();
      } else {
        // Sine wave / data visualization
        ctx.strokeStyle = `rgba(34, 211, 238, ${flicker})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 36; i++) {
          const sx = wx + 2 + i;
          const sy = wy + 21 + Math.sin((i + time * 0.02) * 0.3) * 8;
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      // Window border glow
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 + cyanPulse * 0.3})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(wx, wy, 40, 42);
    };

    drawHoloWindow(bx + 20, by + 48, '3d');
    drawHoloWindow(bx + bw - 62, by + 48, 'wave');

    // Entrance door (north facing)
    const doorX = bx + bw / 2 - 24;
    const doorY = by + 36;

    if (isNearby) {
      const doorGlow = (Math.sin(time * 0.008) + 1) * 0.5;
      ctx.fillStyle = `rgba(6, 182, 212, ${0.2 + doorGlow * 0.25})`;
      ctx.fillRect(doorX - 10, doorY - 10, 68, 66);
    }

    ctx.fillStyle = '#0C4A6E';
    ctx.fillRect(doorX - 3, doorY - 3, 54, 50);
    ctx.fillStyle = '#164E63';
    ctx.fillRect(doorX, doorY, 48, 44);
    // Door glass panels with cyan tint
    ctx.fillStyle = '#155E75';
    ctx.fillRect(doorX + 3, doorY + 3, 20, 38);
    ctx.fillRect(doorX + 25, doorY + 3, 20, 38);
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 1;
    ctx.strokeRect(doorX + 3, doorY + 3, 42, 38);

    // Threshold with tech grid
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(doorX - 6, doorY - 6, 60, 6);
    for (let c = 0; c < 8; c++) {
      ctx.fillStyle = c % 2 === 0 ? '#06B6D4' : '#0891B2';
      ctx.fillRect(doorX - 4 + c * 8, doorY - 5, 8, 4);
    }

    // Lock badge
    const lockCheck = ProgressionSystem.isBuildingUnlocked(b.id, progress);
    if (!lockCheck.unlocked) {
      drawLockBadge(ctx, doorX + 24, doorY + 22);
    }

    // Signboard
    const signW = 200;
    const signH = 24;
    const signX = bx + bw / 2 - signW / 2;
    const signY = by + 32;

    ctx.fillStyle = '#0F172AF2';
    ctx.fillRect(signX, signY, signW, signH);
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(signX, signY, signW, signH);

    ctx.fillStyle = '#ECFEFF';
    ctx.font = `bold 11px ${uiFontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('🌐 THẾ GIỚI 3D', bx + bw / 2, signY + 16);
  };

  const drawSignboard = (ctx: CanvasRenderingContext2D, b: BuildingInfo, cx: number, cy: number) => {
    const sw = 170;
    const sh = 24;
    ctx.fillStyle = '#0F172AEE';
    ctx.fillRect(cx - sw / 2, cy, sw, sh);
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - sw / 2, cy, sw, sh);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 11px ${uiFontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${b.icon} ${b.vietnameseName}`, cx, cy + 16);
  };

  const drawLockBadge = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    // Elegant compact brass pixel-art lock badge
    ctx.fillStyle = '#0F172ACC';
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Golden lock body
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(cx - 5, cy - 2, 10, 8);
    // Silver/Brass Shackle
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 4, Math.PI, 0);
    ctx.stroke();
    // Keyhole
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(cx - 1, cy + 1, 2, 3);
  };

  // ==========================================
  // Y-SORTED ENTITIES (Trees, player, street lamps, benches, flagpole)
  // ==========================================

  const drawDepthSortedEntities = (ctx: CanvasRenderingContext2D, time: number) => {
    interface RenderEntity {
      yBase: number;
      render: () => void;
    }

    const entities: RenderEntity[] = [];

    // 1. Player
    entities.push({
      yBase: stateRef.current.player.y * TILE_SIZE + 18,
      render: () => drawPlayer(ctx, stateRef.current.player, time),
    });

    // 2. Vietnam Flagpole in front of School
    entities.push({
      yBase: 7.2 * TILE_SIZE,
      render: () => drawFlagpole(ctx, 14.8 * TILE_SIZE, 6.8 * TILE_SIZE, time),
    });

    // 3. Trees
    const trees = [
      { x: 11, y: 3.5 },
      { x: 23.2, y: 3.5 },
      { x: 1, y: 11 },
      { x: 10.5, y: 11 },
      { x: 23.5, y: 11 },
      { x: 33, y: 11 },
      { x: 1, y: 20 },
      { x: 33, y: 20 },
    ];

    trees.forEach((t) => {
      entities.push({
        yBase: (t.y + 1.8) * TILE_SIZE,
        render: () => drawTree(ctx, t.x * TILE_SIZE, t.y * TILE_SIZE, time),
      });
    });

    // 4. Street Lamps
    const lamps = [
      { x: 15, y: 8 },
      { x: 20, y: 8 },
      { x: 15, y: 15 },
      { x: 20, y: 15 },
    ];

    lamps.forEach((l) => {
      entities.push({
        yBase: (l.y + 0.8) * TILE_SIZE,
        render: () => drawStreetLamp(ctx, l.x * TILE_SIZE + 24, l.y * TILE_SIZE + 24, time),
      });
    });

    // 5. Plaza Benches
    const benches = [
      { x: 14, y: 11 },
      { x: 21, y: 11 },
    ];
    benches.forEach((bn) => {
      entities.push({
        yBase: (bn.y + 0.8) * TILE_SIZE,
        render: () => drawBench(ctx, bn.x * TILE_SIZE, bn.y * TILE_SIZE),
      });
    });

    // Sort by Y-coordinate so objects behind render first
    entities.sort((a, b) => a.yBase - b.yBase);

    // Execute render calls
    entities.forEach((e) => e.render());
  };

  const drawTree = (ctx: CanvasRenderingContext2D, tx: number, ty: number, time: number) => {
    // Tree Shadow
    ctx.fillStyle = '#0000002E';
    ctx.beginPath();
    ctx.ellipse(tx + 36, ty + 72, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#5C2B16';
    ctx.fillRect(tx + 30, ty + 42, 12, 32);

    // Layered Pixel-Art Foliage Canopy with subtle sway
    const sway = Math.sin(time * 0.002 + tx) * 2;

    // Dark base layer
    ctx.fillStyle = '#14532D';
    ctx.beginPath();
    ctx.arc(tx + 36 + sway, ty + 28, 34, 0, Math.PI * 2);
    ctx.fill();

    // Medium lush canopy
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.arc(tx + 34 + sway * 0.8, ty + 24, 28, 0, Math.PI * 2);
    ctx.fill();

    // Highlight canopy
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(tx + 30 + sway * 0.6, ty + 18, 20, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawStreetLamp = (ctx: CanvasRenderingContext2D, lx: number, ly: number, time: number) => {
    // Cast warm light pool on the ground
    const flicker = 0.85 + Math.sin(time * 0.008) * 0.15;
    ctx.fillStyle = `rgba(254, 240, 138, ${0.12 * flicker})`;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 42, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cast Shadow
    ctx.fillStyle = '#00000022';
    ctx.fillRect(lx - 4, ly - 2, 8, 4);

    // Post
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(lx - 2, ly - 36, 4, 36);

    // Curved bracket & Lantern
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(lx - 6, ly - 40, 12, 6);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(lx - 4, ly - 34, 8, 10);
  };

  const drawBench = (ctx: CanvasRenderingContext2D, bx: number, by: number) => {
    // Shadow
    ctx.fillStyle = '#00000022';
    ctx.fillRect(bx + 4, by + 28, 36, 6);

    // Cast stone / wooden slats
    ctx.fillStyle = '#B45309';
    ctx.fillRect(bx + 6, by + 16, 32, 10);
    ctx.fillStyle = '#334155';
    ctx.fillRect(bx + 4, by + 24, 36, 5);
  };

  const drawFlagpole = (ctx: CanvasRenderingContext2D, fx: number, fy: number, time: number) => {
    // Base pedestal
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(fx - 4, fy - 2, 8, 4);

    // Silver Pole
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(fx - 1, fy - 48, 2, 48);

    // Golden Finial Ball
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(fx, fy - 48, 3, 0, Math.PI * 2);
    ctx.fill();

    // Fluttering Vietnam National Flag (Red with Yellow Star)
    const wave = Math.sin(time * 0.007) * 3;
    ctx.fillStyle = '#DC2626'; // Deep Red
    ctx.fillRect(fx + 1, fy - 46 + wave * 0.3, 24, 16);

    // Golden Star in center
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(fx + 13, fy - 38 + wave * 0.3, 3.5, 0, Math.PI * 2);
    ctx.fill();
  };

  // ==========================================
  // COMPLETE 4-DIRECTION CHARACTER ANIMATION
  // ==========================================

  const drawPlayer = (
    ctx: CanvasRenderingContext2D,
    player: {
      x: number;
      y: number;
      facing: Direction;
      isWalking: boolean;
      stepFrame: number;
      celebrateTimer: number;
    },
    time: number
  ) => {
    const px = player.x * TILE_SIZE;
    const py = player.y * TILE_SIZE;

    // 1. LEGS & WALKING STRIDE OFFSETS
    let legL = 0;
    let legR = 0;
    if (player.isWalking) {
      if (player.stepFrame === 1) {
        legL = -3.5;
        legR = 3;
      } else if (player.stepFrame === 3) {
        legL = 3;
        legR = -3.5;
      }
    }

    // Dynamic foot shadow (squashes and stretches realistically with stride)
    const shadowStretch = player.isWalking ? 1 + Math.abs(legL) * 0.1 : 1 + Math.sin(time * 0.003) * 0.05;
    ctx.fillStyle = '#0000003A';
    ctx.beginPath();
    ctx.ellipse(px, py + 23, 18.2 * shadowStretch, 6.2 / shadowStretch, 0, 0, Math.PI * 2);
    ctx.fill();

    // Idle breathing micro-bobbing vs walking bobbing vs celebration jump
    let bob = 0;
    if (player.celebrateTimer > 0) {
      bob = -Math.abs(Math.sin(time * 0.015)) * 14;
    } else if (player.isWalking) {
      bob = player.stepFrame % 2 === 1 ? -2.5 : 1;
    } else {
      bob = Math.sin(time * 0.003) * 1.2; // Subtle breathing bob
    }

    const skin = character.skinTone || '#FCD34D';
    const hair = character.hairColor || '#1E293B';
    const eyes = character.eyeColor || '#0F172A';
    const outfit = character.outfit || 'thcs_uniform';
    const outfitColor = character.outfitColor || '#2563EB';
    const accessory = character.accessory || 'none';

    // Scale character to an expressive, prominent size (+10% larger: 1.28x)
    ctx.save();
    ctx.translate(px, py + bob);
    ctx.scale(1.28, 1.28);

    // ==========================================
    // 2. LEGS & SHOES (4-Direction Rendering)
    // ==========================================
    ctx.fillStyle = '#1E293B'; // Pants navy

    if (player.facing === 'left') {
      // Side profile facing left
      ctx.fillRect(-6 + legL, 8, 6, 8);
      ctx.fillRect(1 - legL, 8, 6, 8);
      // Shoes facing left
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-9 + legL, 15, 9, 4);
      ctx.fillRect(-1 - legL, 15, 8, 4);
    } else if (player.facing === 'right') {
      // Side profile facing right
      ctx.fillRect(0 + legR, 8, 6, 8);
      ctx.fillRect(-7 - legR, 8, 6, 8);
      // Shoes facing right
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0 + legR, 15, 9, 4);
      ctx.fillRect(-7 - legR, 15, 8, 4);
    } else if (player.facing === 'up') {
      // Back view: both legs stepping
      ctx.fillRect(-7, 8 + legL, 5, 8);
      ctx.fillRect(2, 8 + legR, 5, 8);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-8, 15 + legL, 7, 4);
      ctx.fillRect(1, 15 + legR, 7, 4);
    } else {
      // Down (Front view): both legs stepping
      ctx.fillRect(-7, 8 + legL, 5, 8);
      ctx.fillRect(2, 8 + legR, 5, 8);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-8, 15 + legL, 7, 4);
      ctx.fillRect(1, 15 + legR, 7, 4);
    }

    // ==========================================
    // 3. TORSO & OUTFIT (4-Direction Rendering)
    // ==========================================
    ctx.fillStyle = outfit === 'thcs_uniform' ? '#FFFFFF' : outfitColor;
    ctx.fillRect(-10, -6, 20, 15);

    if (player.facing === 'down') {
      // Front View: Red Scarf hanging over white shirt
      if (outfit === 'thcs_uniform') {
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(-5, 1);
        ctx.lineTo(5, 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(-2, 1, 4, 8);
      } else if (outfit === 'stem_coat') {
        ctx.fillStyle = '#0D9488';
        ctx.fillRect(-4, -6, 8, 8);
      }
    } else if (player.facing === 'up') {
      // Back View: Collar seam & red scarf knot at nape
      if (outfit === 'thcs_uniform') {
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(-6, -6, 12, 2);
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(-3, -2);
        ctx.lineTo(3, -2);
        ctx.closePath();
        ctx.fill();
      }
      // Student Backpack on back
      ctx.fillStyle = '#1D4ED8';
      ctx.fillRect(-7, -4, 14, 11);
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(-6, -1, 12, 7);
      ctx.fillStyle = '#F59E0B'; // Buckle
      ctx.fillRect(-2, 2, 4, 3);
    } else if (player.facing === 'left') {
      // Left Profile: Red scarf fold with flutter tip
      if (outfit === 'thcs_uniform') {
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(-8, -4, 4, 7);
        const flutter = Math.sin(time * 0.006) * 1.5;
        ctx.fillRect(0, -1 + flutter, 4, 4);
      }
    } else {
      // Right Profile: Red scarf fold with flutter tip
      if (outfit === 'thcs_uniform') {
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(4, -4, 4, 7);
        const flutter = Math.sin(time * 0.006) * 1.5;
        ctx.fillRect(-4, -1 + flutter, 4, 4);
      }
    }

    // ==========================================
    // 4. ARMS & SLEEVES (Gait cycle swing)
    // ==========================================
    const armL = player.isWalking ? (player.stepFrame === 1 ? 3 : -3) : 0;
    const armR = player.isWalking ? (player.stepFrame === 1 ? -3 : 3) : 0;
    const armRaise = player.celebrateTimer > 0 ? -12 : 0;

    ctx.fillStyle = outfit === 'thcs_uniform' ? '#FFFFFF' : outfitColor;
    if (player.facing === 'down' || player.facing === 'up') {
      ctx.fillRect(-14, -4 + armL + armRaise, 4, 10);
      ctx.fillRect(10, -4 + armR + armRaise, 4, 10);
      ctx.fillStyle = skin;
      ctx.fillRect(-14, 5 + armL + armRaise, 4, 4);
      ctx.fillRect(10, 5 + armR + armRaise, 4, 4);
    } else if (player.facing === 'left') {
      ctx.fillRect(-4 + legL * 0.5, -4, 4, 10);
      ctx.fillStyle = skin;
      ctx.fillRect(-4 + legL * 0.5, 5, 4, 4);
    } else {
      ctx.fillRect(0 + legR * 0.5, -4, 4, 10);
      ctx.fillStyle = skin;
      ctx.fillRect(0 + legR * 0.5, 5, 4, 4);
    }

    // ==========================================
    // 5. HEAD, FACE & HAIR (4-Direction Rendering)
    // ==========================================
    ctx.fillStyle = skin;
    ctx.fillRect(-10, -22, 20, 17);

    if (player.facing === 'down') {
      // Front View Face
      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-6, -16, 4, 5);
      ctx.fillRect(2, -16, 4, 5);
      ctx.fillStyle = eyes;
      ctx.fillRect(-5, -14, 3, 3);
      ctx.fillRect(3, -14, 3, 3);

      // Rosy Cheeks
      ctx.fillStyle = '#FB7185';
      ctx.fillRect(-8, -10, 2, 2);
      ctx.fillRect(6, -10, 2, 2);

      // Cheerful Smile
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(-2, -8, 4, 2);

      // Hair (Front bangs & sideburns)
      ctx.fillStyle = hair;
      ctx.fillRect(-12, -26, 24, 7);
      ctx.fillRect(-12, -23, 4, 10);
      ctx.fillRect(8, -23, 4, 10);

      if (character.hairStyle === 'spiky') {
        ctx.fillRect(-8, -30, 4, 5);
        ctx.fillRect(4, -30, 4, 5);
      } else if (character.hairStyle === 'ponytail') {
        ctx.fillRect(8, -30, 8, 8);
      }
    } else if (player.facing === 'up') {
      // Back View: Full hair covering back of head
      ctx.fillStyle = hair;
      ctx.fillRect(-12, -26, 24, 21);
      ctx.fillRect(-10, -5, 20, 2); // Nape hair line

      if (character.hairStyle === 'spiky') {
        ctx.fillRect(-8, -30, 4, 5);
        ctx.fillRect(4, -30, 4, 5);
      } else if (character.hairStyle === 'ponytail') {
        ctx.fillRect(-4, -28, 8, 14); // Ponytail hanging down back
        ctx.fillStyle = '#DC2626'; // Ribbon band
        ctx.fillRect(-3, -29, 6, 2);
      }
    } else if (player.facing === 'left') {
      // Left Profile: Side Eye & Left Hair
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-8, -16, 4, 5);
      ctx.fillStyle = eyes;
      ctx.fillRect(-8, -14, 3, 3);

      ctx.fillStyle = '#FB7185'; // Cheek
      ctx.fillRect(-9, -10, 2, 2);

      ctx.fillStyle = hair;
      ctx.fillRect(-11, -26, 22, 8);
      ctx.fillRect(1, -23, 10, 16); // Back hair bulk
      ctx.fillRect(-11, -20, 5, 6); // Front side bang

      if (character.hairStyle === 'spiky') {
        ctx.fillRect(-6, -30, 6, 5);
      } else if (character.hairStyle === 'ponytail') {
        ctx.fillRect(6, -26, 8, 8); // Ponytail streaming right/back
      }
    } else {
      // Right Profile: Side Eye & Right Hair
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(4, -16, 4, 5);
      ctx.fillStyle = eyes;
      ctx.fillRect(5, -14, 3, 3);

      ctx.fillStyle = '#FB7185'; // Cheek
      ctx.fillRect(7, -10, 2, 2);

      ctx.fillStyle = hair;
      ctx.fillRect(-11, -26, 22, 8);
      ctx.fillRect(-11, -23, 10, 16); // Back hair bulk
      ctx.fillRect(6, -20, 5, 6); // Front side bang

      if (character.hairStyle === 'spiky') {
        ctx.fillRect(0, -30, 6, 5);
      } else if (character.hairStyle === 'ponytail') {
        ctx.fillRect(-14, -26, 8, 8); // Ponytail streaming left/back
      }
    }

    // ==========================================
    // 6. ACCESSORIES (4-Direction Rendering)
    // ==========================================
    if (accessory === 'glasses') {
      if (player.facing === 'down') {
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.strokeRect(-7, -16, 6, 6);
        ctx.strokeRect(1, -16, 6, 6);
        ctx.beginPath();
        ctx.moveTo(-1, -13);
        ctx.lineTo(1, -13);
        ctx.stroke();
      } else if (player.facing === 'left') {
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, -16, 5, 6);
        ctx.beginPath();
        ctx.moveTo(-3, -14);
        ctx.lineTo(2, -15);
        ctx.stroke();
      } else if (player.facing === 'right') {
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.strokeRect(3, -16, 5, 6);
        ctx.beginPath();
        ctx.moveTo(3, -14);
        ctx.lineTo(-2, -15);
        ctx.stroke();
      }
    } else if (accessory === 'vr_headset') {
      ctx.fillStyle = '#06B6D4';
      if (player.facing === 'down') {
        ctx.fillRect(-9, -17, 18, 6);
        ctx.fillStyle = '#A5F3FC';
        ctx.fillRect(-7, -15, 14, 2);
      } else if (player.facing === 'up') {
        ctx.fillRect(-9, -16, 18, 3); // Headstrap at back
      } else if (player.facing === 'left') {
        ctx.fillRect(-10, -17, 8, 6);
        ctx.fillRect(-2, -15, 10, 2);
      } else {
        ctx.fillRect(2, -17, 8, 6);
        ctx.fillRect(-8, -15, 10, 2);
      }
    } else if (accessory === 'headphones') {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -18, 12, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#1D4ED8';
      if (player.facing === 'down' || player.facing === 'up') {
        ctx.fillRect(-13, -18, 4, 7);
        ctx.fillRect(9, -18, 4, 7);
      } else if (player.facing === 'left') {
        ctx.fillRect(-2, -18, 5, 7);
      } else {
        ctx.fillRect(-3, -18, 5, 7);
      }
    }

    ctx.restore(); // Restore 1.28x scale for character body

    // ==========================================
    // 7. FLOATING NAME TAG (Spacious black badge, fitting full name clearly)
    // ==========================================
    ctx.save();
    ctx.translate(px, py + bob);

    const nameText = `${character.name || 'Học sinh'} (${character.className || '7A1'})`;
    ctx.font = `bold 10px ${uiFontFamily}`;
    const textWidth = ctx.measureText(nameText).width;
    const tagPadding = 24; // Ample horizontal padding on both sides
    const tagWidth = Math.max(130, Math.ceil(textWidth + tagPadding));
    const tagHeight = 20;
    const tagX = -tagWidth / 2;
    const tagY = -56; // Comfortably and cleanly above 1.28x taller head/hair

    ctx.fillStyle = '#0F172AF2';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 5);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillRect(tagX, tagY, tagWidth, tagHeight);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameText, 0, tagY + tagHeight / 2);

    ctx.restore();
  };

  const drawParticlesAndLeaves = (ctx: CanvasRenderingContext2D) => {
    // Dust Particles
    stateRef.current.particles.forEach((p) => {
      ctx.fillStyle = `rgba(214, 211, 209, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Drifting Leaves
    stateRef.current.leaves.forEach((l) => {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.angle);
      ctx.fillStyle = l.color;
      ctx.fillRect(-3, -1.5, 6, 3);
      ctx.restore();
    });
  };

  const drawPathTrail = (ctx: CanvasRenderingContext2D) => {
    const path = stateRef.current.path;
    if (path.length === 0) return;

    ctx.save();
    ctx.strokeStyle = '#38BDF8AA';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(
      stateRef.current.player.x * TILE_SIZE,
      stateRef.current.player.y * TILE_SIZE
    );
    for (const pt of path) {
      ctx.lineTo(pt.x * TILE_SIZE, pt.y * TILE_SIZE);
    }
    ctx.stroke();

    const dest = path[path.length - 1];
    ctx.setLineDash([]);
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(dest.x * TILE_SIZE, dest.y * TILE_SIZE, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#38BDF888';
    ctx.beginPath();
    ctx.arc(dest.x * TILE_SIZE, dest.y * TILE_SIZE, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawQuestMarkers = (ctx: CanvasRenderingContext2D, time: number) => {
    const bounce = Math.sin(time * 0.006) * 4;

    Object.values(BUILDINGS).forEach((b) => {
      const hasActiveQuest = progress.quests.some(
        (q) => q.locationId === b.id && !q.completed
      );

      if (hasActiveQuest) {
        const mx = (b.x + b.width / 2) * TILE_SIZE;
        const my = b.y * TILE_SIZE - 20 + bounce;

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(mx, my, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold 15px ${uiFontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('!', mx, my + 5.5);
      }
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      {/* 2D HTML5 Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair block"
        role="img"
        aria-label="Bản đồ thành phố VINA-EDUVERSE. Dùng phím mũi tên hoặc W A S D để di chuyển, phím E để vào địa điểm. Có thể mở danh sách khu vực ở thanh trên cùng."
      />

      {/* TARGET UNREACHABLE TOAST */}
      {targetToast && (
        <div role="status" className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-rose-900/90 border border-rose-500 text-rose-100 text-xs px-4 py-2 rounded-xl shadow-xl backdrop-blur">
          {targetToast}
        </div>
      )}

      {/* SLEEK COMPACT PROXIMITY CARD (NON-OBSTRUCTIVE & EASILY DISMISSIBLE) */}
      {!paused && nearbyBuilding && dismissedBuildingId !== nearbyBuilding.id && (() => {
        const lockCheck = ProgressionSystem.isBuildingUnlocked(nearbyBuilding.id, progress);
        return (
          <div className="absolute top-16 left-4 right-4 sm:top-auto sm:left-auto sm:bottom-5 sm:right-24 z-30 sm:w-80 bg-slate-900/95 border border-indigo-500/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md text-white animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner"
                  style={{ backgroundColor: nearbyBuilding.color }}
                >
                  {nearbyBuilding.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate">
                    {nearbyBuilding.vietnameseName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {lockCheck.unlocked ? (
                      <span className="text-[9.5px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-semibold">
                        Đang mở cửa
                      </span>
                    ) : (
                      <span className="text-[9.5px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Chưa mở
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => setDismissedBuildingId(nearbyBuilding.id)}
                className="min-w-11 min-h-11 -m-2 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Đóng [Esc]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-[11px] text-slate-300 leading-relaxed mt-2 break-words">
              {nearbyBuilding.description}
            </p>

            {/* Unlock requirement if locked */}
            {!lockCheck.unlocked && (
              <div className="text-[10.5px] text-amber-300 font-medium mt-2 flex items-center gap-1.5 bg-amber-950/60 p-2 rounded-lg border border-amber-800/50">
                <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>{lockCheck.reason || nearbyBuilding.unlockRequirement.description}</span>
              </div>
            )}

            {/* Primary Action Button */}
            {lockCheck.unlocked ? (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    sound.playInteract();
                    onEnterBuilding(nearbyBuilding);
                  }}
                  className="w-full min-h-11 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <span>VÀO KHÁM PHÁ</span>
                  <span className="px-1 py-0.2 bg-white/20 rounded text-[9px] font-mono">
                    [E]
                  </span>
                </button>
              </div>
            ) : (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-center">
                <span className="text-[10px] text-rose-300 font-medium bg-rose-950/60 border border-rose-900/60 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Khu vực đang bị khóa
                </span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
