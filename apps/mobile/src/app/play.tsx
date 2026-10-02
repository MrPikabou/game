import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGameStore, TurretType, TurretBuild, rollModuleDrop } from '@/utils/gameStore';
import {
  TURRET_DEFS,
  TURRET_SURFACE_X,
  SURFACE_Y,
  SURFACE_TURRET_W,
  SURFACE_TURRET_H,
  GROUND_H,
  PLAYER_W,
  PLAYER_H,
  getTurretStats,
  pickAugments,
  RunAugment,
  getMapDef,
} from '@/utils/gameConfig';
import { EnemyDef } from '@/utils/enemies/types';
import { ENEMY_MAP, pickEnemyId, rollMaterialDrop } from '@/utils/enemies';
import { Heart, Pause, Play as PlayIcon, LogOut, Shield, Trophy } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { MotiView } from 'moti';

const { width, height } = Dimensions.get('window');
const PLAYER_ABS_Y = height - GROUND_H - PLAYER_H - 2;
const XP_PER_LEVEL = 180;
const WIN_LEVEL = 20;

const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: ((i * 137.508) % 1) * width,
  y: ((i * 97.141 + 13) % 1) * (height * 0.72),
  r: (i % 3) + 1,
  o: 0.08 + (i % 5) * 0.05,
}));

// ─── Interfaces ────────────────────────────────────────────────
interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  def: EnemyDef;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  prevX: number;
  prevY: number;
  damage: number;
  color: string;
  size: number;
  source: 'player' | TurretType;
  piercing: boolean;
  targetId?: number; // missile homing
}

interface LightningArc {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  color: string;
}

interface GS {
  enemies: Enemy[];
  bullets: Bullet[];
  arcs: LightningArc[];
  turretCooldowns: number[];
  frame: number;
  health: number;
  maxHealth: number;
  score: number;
  wave: number;
  runLevel: number;
  runXp: number;
  enemyCtr: number;
  bulletCtr: number;
  arcCtr: number;
  playerFireCd: number;
  pendingGold: number;
  pendingXp: number;
  pendingTurretXp: Partial<Record<TurretType, number>>;
  pendingMaterials: Record<string, number>;
  pendingKills: Record<string, number>;
  tempDmgMult: number;
  tempFrMult: number;
  tempSpdMult: number;
  turretDmgMult: Partial<Record<TurretType, number>>;
  turretFrMult: Partial<Record<TurretType, number>>;
  activeSlots: boolean[];
  slotTurretType: (TurretType | null)[];
  isElite: boolean;
  mapSpeedMult: number;
  mapHpMult: number;
}

/**
 * Predictive / lead-target aim.
 * Enemy only moves down (vy = speed, vx = 0).
 * Returns predicted intercept position.
 */
function leadTarget(
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  enemySpeed: number,
  bulletSpd: number
): [number, number] {
  if (bulletSpd <= 0) return [ex, ey];
  const dx = ex - sx,
    dy = ey - sy;
  const a = bulletSpd * bulletSpd - enemySpeed * enemySpeed;
  const b = -2 * dy * enemySpeed;
  const c = -(dx * dx + dy * dy);
  if (Math.abs(a) < 0.0001) return [ex, ey];
  const disc = b * b - 4 * a * c;
  if (disc < 0) return [ex, ey];
  const t = (-b + Math.sqrt(disc)) / (2 * a);
  if (t < 0) return [ex, ey];
  return [ex, ey + enemySpeed * t];
}

/** Sub-step AABB: tests current, previous, and midpoint positions */
function bulletHitsEnemy(b: Bullet, e: Enemy): boolean {
  const hw = Math.max(b.size * 0.5, 4);
  const sz = e.def.size;
  const check = (bx: number, by: number) =>
    bx - hw < e.x + sz && bx + hw > e.x && by - hw < e.y + sz && by + hw > e.y;
  return (
    check(b.x, b.y) ||
    check(b.prevX, b.prevY) ||
    check((b.x + b.prevX) * 0.5, (b.y + b.prevY) * 0.5)
  );
}

// ─── Component ─────────────────────────────────────────────────
export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    addGold,
    addXp,
    addTurretXp,
    endRun,
    turretBuilds,
    addModuleInstance,
    addMaterials,
    incrementCounter,
    recordEnemyKill,
    eliteMode,
    currentMap,
    unlockMap,
  } = useGameStore();

  // ── Player drag ─────────────────────────────────────────────
  const dragStartX = useSharedValue(width / 2 - PLAYER_W / 2);
  const charX = useSharedValue(width / 2 - PLAYER_W / 2);
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      dragStartX.value = charX.value;
    })
    .onUpdate((e) => {
      charX.value = Math.max(0, Math.min(dragStartX.value + e.translationX, width - PLAYER_W));
    });
  const charStyle = useAnimatedStyle(() => ({ left: charX.value }));

  // ── Stable store callbacks ───────────────────────────────────
  const addGoldRef = useRef(addGold);
  const addXpRef = useRef(addXp);
  const addTurretXpRef = useRef(addTurretXp);
  const addMatsRef = useRef(addMaterials);
  const incrRef = useRef(incrementCounter);
  const killRef = useRef(recordEnemyKill);
  const addModRef = useRef(addModuleInstance);
  addGoldRef.current = addGold;
  addXpRef.current = addXp;
  addTurretXpRef.current = addTurretXp;
  addMatsRef.current = addMaterials;
  incrRef.current = incrementCounter;
  killRef.current = recordEnemyKill;
  addModRef.current = addModuleInstance;

  // ── Turret snapshot ──────────────────────────────────────────
  const turretSnap = useRef<Record<TurretType, TurretBuild>>(
    JSON.parse(JSON.stringify(turretBuilds))
  );

  // ── Map / elite ──────────────────────────────────────────────
  const mapDef = getMapDef(currentMap);

  // ── Game state ───────────────────────────────────────────────
  const gs = useRef<GS>({
    enemies: [],
    bullets: [],
    arcs: [],
    turretCooldowns: [0, 0, 0, 0],
    frame: 0,
    health: 100,
    maxHealth: 100,
    score: 0,
    wave: 1,
    runLevel: 1,
    runXp: 0,
    enemyCtr: 0,
    bulletCtr: 0,
    arcCtr: 0,
    playerFireCd: 0,
    pendingGold: 0,
    pendingXp: 0,
    pendingTurretXp: {},
    pendingMaterials: {},
    pendingKills: {},
    tempDmgMult: 1,
    tempFrMult: 1,
    tempSpdMult: 1,
    turretDmgMult: {},
    turretFrMult: {},
    activeSlots: [false, false, false, false],
    slotTurretType: ['cannon', 'laser', 'tesla', 'missile'],
    isElite: eliteMode,
    mapSpeedMult: mapDef.enemySpeedMult,
    mapHpMult: mapDef.enemyHpMult,
  });

  // ── Aim circle ──────────────────────────────────────────────
  const [aimCircle, setAimCircle] = useState<{ x: number; y: number; r: number } | null>(null);
  const aimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showAim = useCallback((x: number, y: number, r: number) => {
    if (aimTimerRef.current) clearTimeout(aimTimerRef.current);
    setAimCircle({ x, y, r });
    aimTimerRef.current = setTimeout(() => setAimCircle(null), 2200);
  }, []);

  // ── UI state ─────────────────────────────────────────────────
  const [, setTick] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [augOptions, setAugOptions] = useState<RunAugment[]>([]);
  const [moduleReward, setModuleReward] = useState<string | null>(null);

  const animRef = useRef<number>(0);
  const tickFnRef = useRef<(() => void) | null>(null);
  const pausedRef = useRef(false);

  const scheduleNext = useCallback(() => {
    if (tickFnRef.current) animRef.current = requestAnimationFrame(tickFnRef.current);
  }, []);

  // ── Pause / exit ─────────────────────────────────────────────
  const pauseGame = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    pausedRef.current = true;
    setIsPaused(true);
  }, []);
  const resumeGame = useCallback(() => {
    pausedRef.current = false;
    setIsPaused(false);
    scheduleNext();
  }, [scheduleNext]);

  const flushPending = useCallback(() => {
    const g = gs.current;
    if (g.pendingGold > 0) {
      addGoldRef.current(g.pendingGold);
      g.pendingGold = 0;
    }
    if (g.pendingXp > 0) {
      addXpRef.current(g.pendingXp);
      g.pendingXp = 0;
    }
    (Object.entries(g.pendingTurretXp) as [TurretType, number][]).forEach(([t, xp]) => {
      if (xp > 0) addTurretXpRef.current(t, xp);
    });
    g.pendingTurretXp = {};
    if (Object.keys(g.pendingMaterials).length) {
      addMatsRef.current({ ...g.pendingMaterials });
      g.pendingMaterials = {};
    }
    if (Object.keys(g.pendingKills).length) {
      Object.entries(g.pendingKills).forEach(([id, n]) => {
        killRef.current(id, n);
        incrRef.current(`kill_${id}`, n);
      });
      incrRef.current(
        'total_kills',
        Object.values(g.pendingKills).reduce((a, b) => a + b, 0)
      );
      g.pendingKills = {};
    }
    incrRef.current('waves_survived', gs.current.wave - 1);
  }, []);

  const exitRun = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    flushPending();
    endRun();
    router.replace('/');
  }, [endRun, flushPending, router]);

  // ── Victory ──────────────────────────────────────────────────
  const triggerVictory = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    flushPending();
    if (currentMap < 4) unlockMap(currentMap + 1);
    const dropped = rollModuleDrop();
    addModRef.current(dropped);
    setModuleReward(dropped);
    endRun();
    setIsVictory(true);
  }, [flushPending, currentMap, unlockMap, endRun]);

  // ── Augment choice ───────────────────────────────────────────
  const handleAugment = useCallback(
    (aug: RunAugment) => {
      const g = gs.current;
      if (aug.category === 'turret_unlock' && aug.turretSlot !== undefined) {
        g.activeSlots[aug.turretSlot] = true;
        if (aug.turretType) incrRef.current(`${aug.turretType}_deployed`);
        incrRef.current('turrets_unlocked_run');
      } else if (aug.category === 'turret' && aug.turretType) {
        const tt = aug.turretType;
        for (const eff of aug.effects) {
          if (eff.applyKey === 'dmg')
            g.turretDmgMult[tt] = (g.turretDmgMult[tt] ?? 1) * eff.applyValue;
          if (eff.applyKey === 'fr')
            g.turretFrMult[tt] = (g.turretFrMult[tt] ?? 1) * eff.applyValue;
        }
      } else {
        for (const eff of aug.effects) {
          if (eff.applyKey === 'dmg') g.tempDmgMult *= eff.applyValue;
          if (eff.applyKey === 'fr') g.tempFrMult *= eff.applyValue;
          if (eff.applyKey === 'spd') g.tempSpdMult *= eff.applyValue;
          if (eff.applyKey === 'heal') g.health = Math.min(g.health + eff.applyValue, g.maxHealth);
          if (eff.applyKey === 'mhp') {
            g.maxHealth = Math.max(10, g.maxHealth + eff.applyValue);
            if (eff.applyValue > 0) g.health += eff.applyValue;
          }
        }
      }
      setShowLevelUp(false);
      scheduleNext();
    },
    [scheduleNext]
  );

  // ─────────────────────────────────────────────────────────────
  // GAME LOOP
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const PLAYER_BASE_DMG = 18;
    const PLAYER_FIRE_FR = 30;
    const PLAYER_BULLET_SPD = 14;

    const tick = () => {
      if (pausedRef.current) return;
      const g = gs.current;
      g.frame++;
      const { wave } = g;

      // Fade lightning arcs
      g.arcs = g.arcs.map((a) => ({ ...a, alpha: a.alpha - 0.17 })).filter((a) => a.alpha > 0);

      // ── 1 PLAYER AUTO-AIM + FIRE ──────────────────────────
      const pCx = charX.value + PLAYER_W * 0.5;
      const pCy = PLAYER_ABS_Y + 14;
      g.playerFireCd--;

      let nearest: Enemy | null = null;
      let nearestD = Infinity;
      for (const e of g.enemies) {
        const d = Math.hypot(e.x + e.def.size * 0.5 - pCx, e.y + e.def.size * 0.5 - pCy);
        if (d < nearestD) {
          nearestD = d;
          nearest = e;
        }
      }

      const playerFR = Math.max(5, PLAYER_FIRE_FR / g.tempFrMult);
      if (g.playerFireCd <= 0 && nearest) {
        g.playerFireCd = playerFR;
        const spd = PLAYER_BULLET_SPD * g.tempSpdMult;
        const ecx = nearest.x + nearest.def.size * 0.5;
        const ecy = nearest.y + nearest.def.size * 0.5;
        const [px, py] = leadTarget(pCx, pCy, ecx, ecy, nearest.speed, spd);
        const dx = px - pCx,
          dy = py - pCy;
        const len = Math.hypot(dx, dy) || 1;
        g.bullets.push({
          id: g.bulletCtr++,
          x: pCx - 4,
          y: pCy,
          prevX: pCx - 4,
          prevY: pCy,
          vx: (dx / len) * spd,
          vy: (dy / len) * spd,
          damage: PLAYER_BASE_DMG * g.tempDmgMult,
          color: '#60a5fa',
          size: 8,
          source: 'player',
          piercing: false,
        });
      }

      // ── 2 TURRET FIRE ────────────────────────────────────
      for (let si = 0; si < 4; si++) {
        if (!g.activeSlots[si]) continue;
        const tt = g.slotTurretType[si];
        if (!tt) continue;
        const build = turretSnap.current[tt];
        const stats = getTurretStats(tt, build.level);
        const def = TURRET_DEFS[tt];
        const tDmg = stats.damage * (g.turretDmgMult[tt] ?? 1);
        const tFr = Math.max(4, stats.fireRateFrames / (g.turretFrMult[tt] ?? 1));
        const tx = TURRET_SURFACE_X[si] + SURFACE_TURRET_W * 0.5;
        const ty = SURFACE_Y + 10;

        g.turretCooldowns[si]--;
        if (g.turretCooldowns[si] > 0) continue;

        let target: Enemy | null = null;
        let tDist = Infinity;
        for (const e of g.enemies) {
          const d = Math.hypot(e.x + e.def.size * 0.5 - tx, e.y + e.def.size * 0.5 - ty);
          if (d <= stats.range && d < tDist) {
            tDist = d;
            target = e;
          }
        }
        if (!target) continue;

        g.turretCooldowns[si] = tFr;

        if (def.isLightning) {
          // Tesla: instant chain lightning
          target.hp -= tDmg;
          g.arcs.push({
            id: g.arcCtr++,
            x1: tx,
            y1: ty,
            x2: target.x + target.def.size * 0.5,
            y2: target.y + target.def.size * 0.5,
            alpha: 1,
            color: '#67e8f9',
          });
          // Chain to 1 nearby enemy
          let closest2: Enemy | null = null;
          let cd2 = Infinity;
          for (const e2 of g.enemies) {
            if (e2.id === target.id) continue;
            const d2 = Math.hypot(
              e2.x + e2.def.size * 0.5 - (target.x + target.def.size * 0.5),
              e2.y + e2.def.size * 0.5 - (target.y + target.def.size * 0.5)
            );
            if (d2 < 100 && d2 < cd2) {
              cd2 = d2;
              closest2 = e2;
            }
          }
          if (closest2) {
            closest2.hp -= tDmg * 0.6;
            g.arcs.push({
              id: g.arcCtr++,
              x1: target.x + target.def.size * 0.5,
              y1: target.y + target.def.size * 0.5,
              x2: closest2.x + closest2.def.size * 0.5,
              y2: closest2.y + closest2.def.size * 0.5,
              alpha: 0.7,
              color: '#a5f3fc',
            });
          }
        } else {
          // Predictive projectile
          const ecx = target.x + target.def.size * 0.5;
          const ecy = target.y + target.def.size * 0.5;
          const [px, py] = leadTarget(tx, ty, ecx, ecy, target.speed, stats.bulletSpeed);
          const dx = px - tx,
            dy = py - ty;
          const len = Math.hypot(dx, dy) || 1;
          g.bullets.push({
            id: g.bulletCtr++,
            x: tx - stats.bulletSize * 0.5,
            y: ty,
            prevX: tx - stats.bulletSize * 0.5,
            prevY: ty,
            vx: (dx / len) * stats.bulletSpeed,
            vy: (dy / len) * stats.bulletSpeed,
            damage: tDmg,
            color: stats.bulletColor,
            size: stats.bulletSize,
            source: tt,
            piercing: stats.piercing,
            targetId: tt === 'missile' ? target.id : undefined,
          });
        }

        if (!g.pendingTurretXp[tt]) g.pendingTurretXp[tt] = 0;
        (g.pendingTurretXp as Record<TurretType, number>)[tt] += 0.5;
      }

      // ── 3 SPAWN ──────────────────────────────────────────
      const spawnRate = Math.max(16, 90 - wave * 4);
      if (g.frame % spawnRate === 0) {
        const eid = pickEnemyId(wave);
        const eDef = ENEMY_MAP[eid] as EnemyDef | undefined;
        if (eDef) {
          const eliteMult = g.isElite ? 2 : 1;
          const hp = (eDef.baseHp + eDef.hpPerWave * wave) * g.mapHpMult * eliteMult;
          const spd = (eDef.speed + eDef.speedPerWave * wave) * g.mapSpeedMult * eliteMult;
          for (let ci = 0; ci < eDef.spawnCount; ci++) {
            g.enemies.push({
              id: g.enemyCtr++,
              x: Math.random() * (width - eDef.size),
              y: -eDef.size - ci * (eDef.spawnYOffset || 40),
              hp,
              maxHp: hp,
              speed: spd,
              def: eDef,
            });
          }
        }
      }

      // ── 4 MOVE BULLETS (missiles home) ───────────────────
      for (const b of g.bullets) {
        b.prevX = b.x;
        b.prevY = b.y;
        if (b.source === 'missile' && b.targetId !== undefined) {
          const tgt = g.enemies.find((e) => e.id === b.targetId);
          if (tgt) {
            const dx = tgt.x + tgt.def.size * 0.5 - b.x;
            const dy = tgt.y + tgt.def.size * 0.5 - b.y;
            const len = Math.hypot(dx, dy) || 1;
            const spd = 7;
            const turn = 0.2;
            b.vx += ((dx / len) * spd - b.vx) * turn;
            b.vy += ((dy / len) * spd - b.vy) * turn;
          } else {
            // Retarget on nearest enemy
            let nd = Infinity;
            let nt: Enemy | null = null;
            for (const e of g.enemies) {
              const d = Math.hypot(e.x + e.def.size * 0.5 - b.x, e.y + e.def.size * 0.5 - b.y);
              if (d < nd) {
                nd = d;
                nt = e;
              }
            }
            b.targetId = nt?.id;
          }
        }
        b.x += b.vx;
        b.y += b.vy;
      }
      g.bullets = g.bullets.filter(
        (b) => b.x > -100 && b.x < width + 100 && b.y > -200 && b.y < height + 60
      );

      // ── 5 MOVE ENEMIES ────────────────────────────────────
      for (const e of g.enemies) {
        e.y += e.speed;
      }

      // ── 6 COLLISION (sub-step) ────────────────────────────
      const consumed = new Set<number>();
      for (const e of g.enemies) {
        for (const b of g.bullets) {
          if (consumed.has(b.id)) continue;
          if (bulletHitsEnemy(b, e)) {
            e.hp -= b.damage;
            if (!b.piercing) consumed.add(b.id);
          }
        }
      }
      g.bullets = g.bullets.filter((b) => !consumed.has(b.id));

      // ── 7 RESOLVE ─────────────────────────────────────────
      const alive: Enemy[] = [];
      for (const e of g.enemies) {
        if (e.hp <= 0) {
          g.score += e.def.goldReward * 12;
          g.pendingGold += e.def.goldReward;
          g.pendingXp += e.def.xpReward;
          g.runXp += e.def.xpReward;
          g.pendingKills[e.def.id] = (g.pendingKills[e.def.id] ?? 0) + 1;
          for (let si = 0; si < 4; si++) {
            if (!g.activeSlots[si]) continue;
            const tt = g.slotTurretType[si];
            if (tt) {
              if (!g.pendingTurretXp[tt]) g.pendingTurretXp[tt] = 0;
              (g.pendingTurretXp as Record<TurretType, number>)[tt] += e.def.turretXpReward;
            }
          }
          // Material drop
          const drop = rollMaterialDrop(e.def);
          if (drop) {
            const dropAmt = g.isElite && Math.random() < 0.5 ? 2 : 1;
            g.pendingMaterials[drop] = (g.pendingMaterials[drop] ?? 0) + dropAmt;
          }
        } else if (e.y + e.def.size >= height - GROUND_H) {
          g.health = Math.max(0, g.health - e.def.baseDamage);
        } else {
          alive.push(e);
        }
      }
      g.enemies = alive;

      // ── 8 FLUSH (every 60 frames) ─────────────────────────
      if (g.frame % 60 === 0) {
        if (g.pendingGold > 0) {
          addGoldRef.current(g.pendingGold);
          g.pendingGold = 0;
        }
        if (g.pendingXp > 0) {
          addXpRef.current(g.pendingXp);
          g.pendingXp = 0;
        }
        (Object.entries(g.pendingTurretXp) as [TurretType, number][]).forEach(([t, xp]) => {
          if (xp > 0) {
            addTurretXpRef.current(t, xp);
            (g.pendingTurretXp as Record<TurretType, number>)[t] = 0;
          }
        });
        if (Object.keys(g.pendingMaterials).length) {
          addMatsRef.current({ ...g.pendingMaterials });
          g.pendingMaterials = {};
        }
      }

      // ── 9 RUN LEVEL UP ───────────────────────────────────
      const xpNeeded = g.runLevel * XP_PER_LEVEL;
      if (g.runXp >= xpNeeded) {
        g.runXp -= xpNeeded;
        g.runLevel++;
        g.wave = Math.max(g.wave, g.runLevel);
        incrRef.current('run_level_ups');
        incrRef.current('run_level_reached', 1);
        if (g.runLevel >= WIN_LEVEL) {
          triggerVictory();
          return;
        }
        setAugOptions(pickAugments(3, g.activeSlots, g.slotTurretType));
        setShowLevelUp(true);
        setTick((t) => t + 1);
        return;
      }

      // ── 10 GAME OVER ─────────────────────────────────────
      if (g.health <= 0) {
        g.health = 0;
        setIsGameOver(true);
        setTick((t) => t + 1);
        return;
      }

      setTick((t) => t + 1);
      animRef.current = requestAnimationFrame(tick);
    };

    tickFnRef.current = tick;
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const g = gs.current;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      {STARS.map((st, i) => (
        <View
          key={i}
          style={[s.star, { left: st.x, top: st.y, width: st.r, height: st.r, opacity: st.o }]}
        />
      ))}

      {/* HUD */}
      <View style={[s.hud, { paddingTop: insets.top + 6 }]}>
        <View style={s.hudRow}>
          <View style={s.hpBox}>
            <Heart size={13} color="#ef4444" fill="#ef4444" />
            <View style={s.barBg}>
              <View
                style={[
                  s.barFill,
                  {
                    width: `${Math.max(0, (g.health / g.maxHealth) * 100)}%` as `${number}%`,
                    backgroundColor: g.health < g.maxHealth * 0.3 ? '#f97316' : '#ef4444',
                  },
                ]}
              />
            </View>
            <Text style={s.hpText}>
              {g.health}/{g.maxHealth}
            </Text>
          </View>
          <Text style={s.waveText}>W{g.wave}</Text>
          <TouchableOpacity
            onPress={pauseGame}
            style={s.pauseBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Pause size={17} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.xpRow}>
          <Text style={s.lvText}>
            LV.{g.runLevel}/{WIN_LEVEL}
          </Text>
          <View style={s.xpBg}>
            <View
              style={[
                s.xpFill,
                {
                  width:
                    `${Math.min(100, (g.runXp / (g.runLevel * XP_PER_LEVEL)) * 100)}%` as `${number}%`,
                },
              ]}
            />
          </View>
          <Text style={s.scoreText}>{g.score.toLocaleString()}</Text>
        </View>
        <View style={s.slotBar}>
          {g.slotTurretType.map((tt, i) => {
            const active = g.activeSlots[i];
            const def = tt ? TURRET_DEFS[tt] : null;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  if (!active || !def || !tt) return;
                  const stats = getTurretStats(tt, turretSnap.current[tt].level);
                  const tx = TURRET_SURFACE_X[i] + SURFACE_TURRET_W * 0.5;
                  const ty = SURFACE_Y + SURFACE_TURRET_H * 0.5;
                  showAim(tx, ty, stats.range);
                }}
                style={[
                  s.slotPip,
                  {
                    backgroundColor: active && def ? def.color + 'cc' : '#0c1118',
                    borderColor: active && def ? def.accentColor : '#1e293b',
                  },
                ]}
              >
                <Text style={{ fontSize: 9 }}>{active && def ? def.icon : '🔒'}</Text>
                {active && def && (
                  <Text style={[s.slotName, { color: def.accentColor }]}>{def.name}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* GAME FIELD */}
      <View style={s.field}>
        {/* Aim circle */}
        {aimCircle && (
          <View
            style={{
              position: 'absolute',
              left: aimCircle.x - aimCircle.r,
              top: aimCircle.y - aimCircle.r,
              width: aimCircle.r * 2,
              height: aimCircle.r * 2,
              borderRadius: aimCircle.r,
              borderWidth: 2,
              borderColor: '#3b82f688',
              backgroundColor: '#3b82f60d',
            }}
          />
        )}

        {/* Lightning arcs */}
        {g.arcs.map((a) => {
          const dx = a.x2 - a.x1,
            dy = a.y2 - a.y1;
          const len = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={a.id}
              style={{
                position: 'absolute',
                left: a.x1,
                top: a.y1 - 2,
                width: len,
                height: 4,
                backgroundColor: a.color,
                opacity: a.alpha,
                borderRadius: 2,
                transform: [{ rotate: `${angle}deg` }],
                // @ts-ignore
                transformOrigin: 'left center',
              }}
            />
          );
        })}

        {/* Regular bullets */}
        {g.bullets.map((b) => (
          <View
            key={b.id}
            style={[
              s.bullet,
              {
                left: b.x,
                top: b.y,
                width: b.size,
                height: b.size,
                borderRadius: b.size / 2,
                backgroundColor: b.color,
              },
            ]}
          />
        ))}

        {/* Enemies */}
        {g.enemies.map((e) => (
          <View
            key={e.id}
            style={[
              s.enemy,
              {
                left: e.x,
                top: e.y,
                width: e.def.size,
                height: e.def.size,
                backgroundColor: e.def.color,
                borderColor: e.def.borderColor,
              },
            ]}
          >
            <View style={[s.enemyHpBg, { width: e.def.size }]}>
              <View
                style={[
                  s.enemyHpFill,
                  {
                    width: `${Math.max(0, (e.hp / e.maxHp) * 100)}%` as `${number}%`,
                    backgroundColor: e.def.borderColor,
                  },
                ]}
              />
            </View>
            <Text style={{ fontSize: Math.min(e.def.size * 0.44, 22) }}>{e.def.icon}</Text>
          </View>
        ))}

        {/* Surface turrets */}
        {TURRET_SURFACE_X.map((tx, i) => {
          const active = g.activeSlots[i];
          const tt = g.slotTurretType[i];
          const def = tt ? TURRET_DEFS[tt] : null;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => {
                if (!active || !def || !tt) return;
                const stats = getTurretStats(tt, turretSnap.current[tt].level);
                showAim(
                  tx + SURFACE_TURRET_W * 0.5,
                  SURFACE_Y + SURFACE_TURRET_H * 0.5,
                  stats.range
                );
              }}
              style={[
                s.surfaceTurret,
                {
                  left: tx,
                  top: SURFACE_Y,
                  backgroundColor: active && def ? def.color + 'dd' : '#0c1118',
                  borderColor: active && def ? def.accentColor : '#1e2a3a',
                  opacity: active ? 1 : 0.35,
                },
              ]}
            >
              {active && def ? (
                <>
                  <Text style={s.turretIcon}>{def.icon}</Text>
                  <Text style={[s.turretName, { color: def.accentColor }]}>{def.name}</Text>
                </>
              ) : (
                <Text style={{ fontSize: 16 }}>🔒</Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Player */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[s.player, charStyle]}>
            <TouchableOpacity
              onPress={() =>
                showAim(charX.value + PLAYER_W * 0.5, PLAYER_ABS_Y + PLAYER_H * 0.5, 280)
              }
              style={{ width: '100%', height: '100%', alignItems: 'center' }}
            >
              <View style={s.gunBarrel} />
              <View style={s.playerBody}>
                <Text style={{ fontSize: 24 }}>🤖</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>

        {/* Ground */}
        <View style={s.ground}>
          <View style={s.groundEdge} />
          <Text style={s.groundText}>◄◄ PLANET BASE — DEFEND ►► </Text>
        </View>
      </View>

      {/* PAUSE MODAL */}
      <Modal visible={isPaused} transparent animationType="fade">
        <View style={s.overlay}>
          <MotiView
            from={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={s.modal}
          >
            <Text style={s.mTag}>PAUSED</Text>
            <Text style={s.mTitle}>WAVE {g.wave}</Text>
            <Text style={[s.mScore, { marginBottom: 28 }]}>{g.score.toLocaleString()} pts</Text>
            <TouchableOpacity onPress={resumeGame} style={[s.mBtn, { backgroundColor: '#3b82f6' }]}>
              <PlayIcon size={18} color="#fff" />
              <Text style={s.mBtnTxt}>RESUME</Text>
            </TouchableOpacity>
            <View style={{ height: 12 }} />
            <TouchableOpacity
              onPress={exitRun}
              style={[
                s.mBtn,
                { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
              ]}
            >
              <LogOut size={18} color="#ef4444" />
              <Text style={[s.mBtnTxt, { color: '#ef4444' }]}>ABANDON RUN</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>

      {/* LEVEL UP MODAL */}
      <Modal visible={showLevelUp} transparent animationType="fade">
        <View style={s.overlay}>
          <MotiView
            from={{ scale: 0.78, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={s.modal}
          >
            <Text style={s.mTag}>
              RUN LV.{g.runLevel} · {WIN_LEVEL - g.runLevel} TO WIN
            </Text>
            <Text style={s.mTitle}>CHOOSE AUGMENT</Text>
            {augOptions.map((aug) => (
              <TouchableOpacity
                key={aug.id}
                onPress={() => handleAugment(aug)}
                style={[s.augCard, { borderColor: aug.isNegative ? '#78350f' : '#1e293b' }]}
              >
                <Text style={s.augLbl}>{aug.label}</Text>
                <Text style={s.augDesc}>{aug.description}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  {aug.turretType && (
                    <View
                      style={{
                        backgroundColor: TURRET_DEFS[aug.turretType].color + '44',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: TURRET_DEFS[aug.turretType].accentColor,
                          fontSize: 9,
                          fontFamily: 'Inter_700Bold',
                        }}
                      >
                        {TURRET_DEFS[aug.turretType].name} ONLY
                      </Text>
                    </View>
                  )}
                  {aug.isNegative && (
                    <View
                      style={{
                        backgroundColor: '#7f1d1d44',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ color: '#f97316', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
                        ⚠️ TRADEOFF
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </MotiView>
        </View>
      </Modal>

      {/* VICTORY MODAL */}
      <Modal visible={isVictory} transparent animationType="fade">
        <View style={s.overlay}>
          <MotiView
            from={{ scale: 0.78, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={[s.modal, { alignItems: 'center' }]}
          >
            <Trophy size={56} color="#f59e0b" style={{ marginBottom: 14 }} />
            <Text style={s.mTitle}>PLANET DEFENDED!</Text>
            <Text style={[s.mTag, { fontSize: 14, marginBottom: 4 }]}>
              MAP {currentMap} CLEARED · WAVE {g.wave}
            </Text>
            <Text style={s.bigScore}>{g.score.toLocaleString()}</Text>
            <Text style={[s.mTag, { marginBottom: 16 }]}>SCORE</Text>
            {currentMap < 4 && (
              <View
                style={{
                  backgroundColor: '#0f172a',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#22d3ee55',
                  marginBottom: 16,
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#22d3ee', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
                  🗺️ MAP {currentMap + 1} UNLOCKED!
                </Text>
              </View>
            )}
            {moduleReward && (
              <View
                style={{
                  backgroundColor: '#0f172a',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#a855f755',
                  marginBottom: 20,
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#a855f7', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
                  🎁 MODULE DROP: {moduleReward.toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => router.replace('/')}
              style={[s.mBtn, { backgroundColor: '#f59e0b', width: '100%' }]}
            >
              <Text style={[s.mBtnTxt, { color: '#000' }]}>RETURN TO BASE</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>

      {/* GAME OVER MODAL */}
      <Modal visible={isGameOver} transparent animationType="fade">
        <View style={s.overlay}>
          <MotiView
            from={{ scale: 0.78, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={[s.modal, { alignItems: 'center' }]}
          >
            <Shield size={52} color="#ef4444" style={{ marginBottom: 14 }} />
            <Text style={s.mTitle}>PLANET LOST</Text>
            <Text style={[s.mTag, { marginBottom: 4 }]}>
              WAVE {g.wave} · LV.{g.runLevel}
            </Text>
            <Text style={s.bigScore}>{g.score.toLocaleString()}</Text>
            <Text style={[s.mTag, { marginBottom: 28 }]}>SCORE</Text>
            <TouchableOpacity
              onPress={exitRun}
              style={[s.mBtn, { backgroundColor: '#3b82f6', width: '100%' }]}
            >
              <LogOut size={18} color="#fff" />
              <Text style={s.mBtnTxt}>RETURN TO BASE</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
}

// STYLES
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  star: { position: 'absolute', backgroundColor: '#fff', borderRadius: 99 },
  hud: { paddingHorizontal: 14, zIndex: 10, paddingBottom: 4 },
  hudRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  hpBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  barBg: { flex: 1, height: 7, backgroundColor: '#1f2937', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  hpText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold', minWidth: 48 },
  waveText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_900Black' },
  pauseBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 7,
    borderWidth: 1,
    borderColor: '#334155',
  },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  lvText: { color: '#a855f7', fontSize: 10, fontFamily: 'Inter_900Black' },
  xpBg: { flex: 1, height: 5, backgroundColor: '#1f2937', borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: '#a855f7', borderRadius: 3 },
  scoreText: { color: '#fbbf24', fontSize: 10, fontFamily: 'Inter_700Bold' },
  slotBar: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  slotPip: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  slotName: { fontSize: 7, fontFamily: 'Inter_900Black' },
  field: { flex: 1 },
  bullet: { position: 'absolute' },
  enemy: {
    position: 'absolute',
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyHpBg: {
    position: 'absolute',
    top: -7,
    left: 0,
    height: 4,
    backgroundColor: '#0f172a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  enemyHpFill: { height: '100%', borderRadius: 2 },
  surfaceTurret: {
    position: 'absolute',
    width: SURFACE_TURRET_W,
    height: SURFACE_TURRET_H,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turretIcon: { fontSize: 18 },
  turretName: { fontSize: 6, fontFamily: 'Inter_900Black', letterSpacing: 0.4 },
  player: {
    position: 'absolute',
    top: PLAYER_ABS_Y,
    width: PLAYER_W,
    height: PLAYER_H,
    alignItems: 'center',
  },
  gunBarrel: {
    width: 5,
    height: 14,
    backgroundColor: '#93c5fd',
    borderRadius: 3,
    marginBottom: -2,
  },
  playerBody: {
    width: PLAYER_W,
    height: PLAYER_H - 16,
    backgroundColor: '#1e3a8a',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#60a5fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GROUND_H,
    backgroundColor: '#040d1e',
  },
  groundEdge: { height: 3, backgroundColor: '#1d4ed8', opacity: 0.5 },
  groundText: {
    color: '#172554',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000000e0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modal: {
    width: '100%',
    backgroundColor: '#0a1120',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  mTag: { color: '#a855f7', fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  mTitle: { color: '#fff', fontSize: 26, fontFamily: 'Inter_900Black', marginBottom: 8 },
  mScore: { color: '#fbbf24', fontSize: 15, fontFamily: 'Inter_700Bold' },
  mBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 12,
  },
  mBtnTxt: { color: '#fff', fontSize: 15, fontFamily: 'Inter_900Black' },
  augCard: {
    backgroundColor: '#0f1929',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  augLbl: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  augDesc: { color: '#475569', fontSize: 11, fontFamily: 'Inter_700Bold' },
  bigScore: { color: '#3b82f6', fontSize: 44, fontFamily: 'Inter_900Black' },
});
