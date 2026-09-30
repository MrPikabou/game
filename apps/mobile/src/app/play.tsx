import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGameStore, TurretType, TurretBuild } from '@/utils/gameStore';
import {
  TURRET_DEFS,
  TURRET_SURFACE_X,
  SURFACE_Y,
  SURFACE_TURRET_W,
  SURFACE_TURRET_H,
  GROUND_H,
  PLAYER_W,
  PLAYER_H,
  ENEMY_DEFS,
  pickEnemyType,
  EnemyTypeName,
  getTurretStats,
  pickAugments,
  RunAugment,
} from '@/utils/gameConfig';
import { Heart, Pause, Play as PlayIcon, LogOut, Shield } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { MotiView } from 'moti';

const { width, height } = Dimensions.get('window');
const PLAYER_ABS_Y = height - GROUND_H - PLAYER_H - 2;
const XP_PER_LEVEL = 180;

// Deterministic starfield
const STARS = Array.from({ length: 30 }, (_, i) => ({
  x: ((i * 137.508) % 1) * width,
  y: ((i * 97.141 + 13) % 1) * (height * 0.72),
  r: (i % 3) + 1,
  o: 0.1 + (i % 5) * 0.06,
}));

// ─── Interfaces ───────────────────────────────────────────────
interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: EnemyTypeName;
  reward: number;
  xpReward: number;
  size: number;
  color: string;
  borderColor: string;
  emoji: string;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  size: number;
  source: 'player' | TurretType;
}

// Mutable game state — ref-based, never triggers re-renders directly
interface GS {
  enemies: Enemy[];
  bullets: Bullet[];
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
  playerFireCd: number;
  pendingGold: number;
  pendingXp: number;
  pendingTurretXp: Partial<Record<TurretType, number>>;
  tempDmgMult: number;
  tempFrMult: number;
  tempSpdMult: number;
  activeSlots: boolean[]; // which of the 4 slots are live this run
  slotTurretType: (TurretType | null)[]; // which turret type is in each slot
}

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addGold, addXp, addTurretXp, endRun, turretBuilds } = useGameStore();

  // ── Player drag gesture ──────────────────────────────────────
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

  // ── Stable refs for store callbacks ─────────────────────────
  const addGoldRef = useRef(addGold);
  const addXpRef = useRef(addXp);
  const addTurretXpRef = useRef(addTurretXp);
  addGoldRef.current = addGold;
  addXpRef.current = addXp;
  addTurretXpRef.current = addTurretXp;

  // ── Snapshot turret builds at run start ──────────────────────
  const turretSnap = useRef<Record<TurretType, TurretBuild>>(
    JSON.parse(JSON.stringify(turretBuilds))
  );

  // ── Mutable game state ref ───────────────────────────────────
  const gs = useRef<GS>({
    enemies: [],
    bullets: [],
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
    playerFireCd: 0,
    pendingGold: 0,
    pendingXp: 0,
    pendingTurretXp: {},
    tempDmgMult: 1,
    tempFrMult: 1,
    tempSpdMult: 1,
    activeSlots: [false, false, false, false],
    slotTurretType: ['cannon', 'laser', 'tesla', 'missile'],
  });

  // ── React UI state ───────────────────────────────────────────
  const [, setTick] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [augOptions, setAugOptions] = useState<RunAugment[]>([]);

  const animRef = useRef<number>(0);
  const tickFnRef = useRef<(() => void) | null>(null);
  const pausedRef = useRef(false); // readable inside closure

  const scheduleNext = useCallback(() => {
    if (tickFnRef.current) animRef.current = requestAnimationFrame(tickFnRef.current);
  }, []);

  // ── PAUSE / RESUME / EXIT ────────────────────────────────────
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

  const exitRun = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    const g = gs.current;
    addGoldRef.current(g.pendingGold);
    addXpRef.current(g.pendingXp);
    (Object.entries(g.pendingTurretXp) as [TurretType, number][]).forEach(([t, xp]) => {
      if (xp > 0) addTurretXpRef.current(t, xp);
    });
    endRun();
    router.replace('/');
  }, [endRun, router]);

  // ── AUGMENT PICKED ───────────────────────────────────────────
  const handleAugment = useCallback(
    (aug: RunAugment) => {
      const g = gs.current;
      if (aug.category === 'turret_unlock' && aug.turretSlot !== undefined) {
        g.activeSlots[aug.turretSlot] = true;
      } else {
        switch (aug.applyKey) {
          case 'dmg':
            g.tempDmgMult *= aug.applyValue;
            break;
          case 'fr':
            g.tempFrMult *= aug.applyValue;
            break;
          case 'spd':
            g.tempSpdMult *= aug.applyValue;
            break;
          case 'heal':
            g.health = Math.min(g.health + aug.applyValue, g.maxHealth);
            break;
          case 'mhp':
            g.maxHealth += aug.applyValue;
            g.health += aug.applyValue;
            break;
        }
      }
      setShowLevelUp(false);
      scheduleNext();
    },
    [scheduleNext]
  );

  // ── MAIN GAME LOOP ───────────────────────────────────────────
  useEffect(() => {
    const PLAYER_BASE_DMG = 18;
    const PLAYER_FIRE_FR = 30;
    const PLAYER_BULLET_SPD = 15;

    const tick = () => {
      if (pausedRef.current) return;
      const g = gs.current;
      g.frame++;
      const { wave } = g;

      // 1 ─ PLAYER AUTO-AIM + FIRE ──────────────────────────
      const pCx = charX.value + PLAYER_W * 0.5;
      const pCy = PLAYER_ABS_Y + 14; // near barrel tip
      g.playerFireCd--;

      let nearest: Enemy | null = null;
      let nearestD = Infinity;
      for (const e of g.enemies) {
        const d = Math.hypot(e.x + e.size * 0.5 - pCx, e.y + e.size * 0.5 - pCy);
        if (d < nearestD) {
          nearestD = d;
          nearest = e;
        }
      }

      const fireRate = Math.max(5, PLAYER_FIRE_FR / g.tempFrMult);
      if (g.playerFireCd <= 0 && nearest) {
        g.playerFireCd = fireRate;
        const dx = nearest.x + nearest.size * 0.5 - pCx;
        const dy = nearest.y + nearest.size * 0.5 - pCy;
        const len = Math.hypot(dx, dy) || 1;
        const spd = PLAYER_BULLET_SPD * g.tempSpdMult;
        g.bullets.push({
          id: g.bulletCtr++,
          x: pCx - 4,
          y: pCy, // spawn from barrel
          vx: (dx / len) * spd,
          vy: (dy / len) * spd,
          damage: PLAYER_BASE_DMG * g.tempDmgMult,
          color: '#60a5fa',
          size: 8,
          source: 'player',
        });
      }

      // 2 ─ TURRET AUTO-AIM + FIRE ──────────────────────────
      for (let si = 0; si < 4; si++) {
        if (!g.activeSlots[si]) continue;
        const tt = g.slotTurretType[si];
        if (!tt) continue;

        const build = turretSnap.current[tt];
        const stats = getTurretStats(tt, build.level);
        const tx = TURRET_SURFACE_X[si] + SURFACE_TURRET_W * 0.5;
        const ty = SURFACE_Y + 10; // near top/barrel

        g.turretCooldowns[si]--;
        if (g.turretCooldowns[si] > 0) continue;

        let target: Enemy | null = null;
        let tDist = Infinity;
        for (const e of g.enemies) {
          const d = Math.hypot(e.x + e.size * 0.5 - tx, e.y + e.size * 0.5 - ty);
          if (d <= stats.range && d < tDist) {
            tDist = d;
            target = e;
          }
        }
        if (!target) continue;

        g.turretCooldowns[si] = stats.fireRateFrames;
        const dx = target.x + target.size * 0.5 - tx;
        const dy = target.y + target.size * 0.5 - ty;
        const len = Math.hypot(dx, dy) || 1;
        g.bullets.push({
          id: g.bulletCtr++,
          x: tx - stats.bulletSize * 0.5,
          y: ty,
          vx: (dx / len) * stats.bulletSpeed,
          vy: (dy / len) * stats.bulletSpeed,
          damage: stats.damage,
          color: stats.bulletColor,
          size: stats.bulletSize,
          source: tt,
        });

        // Small turret XP per shot
        if (!g.pendingTurretXp[tt]) g.pendingTurretXp[tt] = 0;
        (g.pendingTurretXp as Record<TurretType, number>)[tt] += 0.5;
      }

      // 3 ─ SPAWN ENEMIES ────────────────────────────────────
      const spawnRate = Math.max(16, 90 - wave * 4);
      if (g.frame % spawnRate === 0) {
        const type = pickEnemyType(wave);
        const def = ENEMY_DEFS[type];
        for (let ci = 0; ci < def.spawnCount; ci++) {
          g.enemies.push({
            id: g.enemyCtr++,
            x: Math.random() * (width - def.size),
            y: -def.size - ci * 40,
            hp: def.hp + wave * 12,
            maxHp: def.hp + wave * 12,
            speed: def.speed + wave * 0.04,
            type,
            reward: def.reward,
            xpReward: def.xpReward,
            size: def.size,
            color: def.color,
            borderColor: def.borderColor,
            emoji: def.emoji,
          });
        }
      }

      // 4 ─ MOVE BULLETS ─────────────────────────────────────
      for (const b of g.bullets) {
        b.x += b.vx;
        b.y += b.vy;
      }
      g.bullets = g.bullets.filter(
        (b) => b.x > -100 && b.x < width + 100 && b.y > -200 && b.y < height + 60
      );

      // 5 ─ MOVE ENEMIES ─────────────────────────────────────
      for (const e of g.enemies) {
        e.y += e.speed;
      }

      // 6 ─ COLLISION (single pass) ──────────────────────────
      const consumed = new Set<number>();
      for (const e of g.enemies) {
        for (const b of g.bullets) {
          if (consumed.has(b.id)) continue;
          if (
            b.x < e.x + e.size &&
            b.x + b.size > e.x &&
            b.y < e.y + e.size &&
            b.y + b.size > e.y
          ) {
            e.hp -= b.damage;
            const tDef = TURRET_DEFS[b.source as TurretType];
            if (!tDef?.piercing) consumed.add(b.id);
          }
        }
      }
      g.bullets = g.bullets.filter((b) => !consumed.has(b.id));

      // 7 ─ RESOLVE DEAD / BREACHED ─────────────────────────
      const alive: Enemy[] = [];
      for (const e of g.enemies) {
        if (e.hp <= 0) {
          g.score += e.reward * 12;
          g.pendingGold += e.reward;
          g.pendingXp += e.xpReward;
          g.runXp += e.xpReward;
          // Bonus XP to active turrets on kill
          for (let si = 0; si < 4; si++) {
            if (!g.activeSlots[si]) continue;
            const tt = g.slotTurretType[si];
            if (tt) {
              if (!g.pendingTurretXp[tt]) g.pendingTurretXp[tt] = 0;
              (g.pendingTurretXp as Record<TurretType, number>)[tt] += 4;
            }
          }
        } else if (e.y + e.size >= height - GROUND_H) {
          g.health = Math.max(0, g.health - 15);
        } else {
          alive.push(e);
        }
      }
      g.enemies = alive;

      // 8 ─ FLUSH TO STORE (every 60 frames) ────────────────
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
      }

      // 9 ─ RUN LEVEL UP ─────────────────────────────────────
      const xpNeeded = g.runLevel * XP_PER_LEVEL;
      if (g.runXp >= xpNeeded) {
        g.runXp -= xpNeeded;
        g.runLevel++;
        g.wave = Math.max(g.wave, g.runLevel);
        setAugOptions(pickAugments(3, g.activeSlots));
        setShowLevelUp(true);
        setTick((t) => t + 1);
        return; // paused — resumed in handleAugment
      }

      // 10 ─ GAME OVER ────────────────────────────────────────
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

  return (
    <View style={s.container}>
      {/* Starfield */}
      {STARS.map((st, i) => (
        <View
          key={i}
          style={[s.star, { left: st.x, top: st.y, width: st.r, height: st.r, opacity: st.o }]}
        />
      ))}

      {/* ── HUD ─────────────────────────────────────────────── */}
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
          <Text style={s.lvText}>LV.{g.runLevel}</Text>
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

        {/* Active turret slots indicator */}
        <View style={s.slotBar}>
          {g.slotTurretType.map((tt, i) => {
            const active = g.activeSlots[i];
            const def = tt ? TURRET_DEFS[tt] : null;
            return (
              <View
                key={i}
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
              </View>
            );
          })}
        </View>
      </View>

      {/* ── GAME FIELD ──────────────────────────────────────── */}
      <View style={s.field}>
        {/* Bullets */}
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
                width: e.size,
                height: e.size,
                backgroundColor: e.color,
                borderColor: e.borderColor,
              },
            ]}
          >
            <View style={[s.enemyHpBg, { width: e.size }]}>
              <View
                style={[
                  s.enemyHpFill,
                  {
                    width: `${Math.max(0, (e.hp / e.maxHp) * 100)}%` as `${number}%`,
                    backgroundColor: e.borderColor,
                  },
                ]}
              />
            </View>
            <Text style={{ fontSize: Math.min(e.size * 0.44, 22) }}>{e.emoji}</Text>
          </View>
        ))}

        {/* Surface turrets — 2 left, 2 right of player */}
        {TURRET_SURFACE_X.map((tx, i) => {
          const active = g.activeSlots[i];
          const tt = g.slotTurretType[i];
          const def = tt ? TURRET_DEFS[tt] : null;
          return (
            <View
              key={i}
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
            </View>
          );
        })}

        {/* Player — draggable along surface */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[s.player, charStyle]}>
            <View style={s.gunBarrel} />
            <View style={s.playerBody}>
              <Text style={{ fontSize: 24 }}>🤖</Text>
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Planet surface */}
        <View style={s.ground}>
          <View style={s.groundEdge} />
          <Text style={s.groundText}>◄◄ PLANET BASE — DEFEND ►► </Text>
        </View>
      </View>

      {/* ── PAUSE MODAL ─────────────────────────────────────── */}
      <Modal visible={isPaused} transparent animationType="fade">
        <View style={s.overlay}>
          <MotiView
            from={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={s.modalBox}
          >
            <Text style={s.modalTag}>PAUSED</Text>
            <Text style={s.modalTitle}>WAVE {g.wave}</Text>
            <Text style={[s.scoreLabel, { marginBottom: 28 }]}>{g.score.toLocaleString()} pts</Text>

            <TouchableOpacity
              onPress={resumeGame}
              style={[s.modalBtn, { backgroundColor: '#3b82f6' }]}
            >
              <PlayIcon size={18} color="#fff" />
              <Text style={s.modalBtnTxt}>RESUME</Text>
            </TouchableOpacity>

            <View style={{ height: 12 }} />

            <TouchableOpacity
              onPress={exitRun}
              style={[
                s.modalBtn,
                { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
              ]}
            >
              <LogOut size={18} color="#ef4444" />
              <Text style={[s.modalBtnTxt, { color: '#ef4444' }]}>ABANDON RUN</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>

      {/* ── LEVEL UP MODAL ──────────────────────────────────── */}
      <Modal visible={showLevelUp} transparent animationType="fade">
        <View style={s.overlay}>
          <MotiView
            from={{ scale: 0.78, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={s.modalBox}
          >
            <Text style={s.modalTag}>RUN LEVEL {g.runLevel}</Text>
            <Text style={s.modalTitle}>CHOOSE AUGMENT</Text>
            {augOptions.map((aug) => (
              <TouchableOpacity key={aug.id} onPress={() => handleAugment(aug)} style={s.augCard}>
                <Text style={s.augLabel}>{aug.label}</Text>
                <Text style={s.augDesc}>{aug.description}</Text>
              </TouchableOpacity>
            ))}
          </MotiView>
        </View>
      </Modal>

      {/* ── GAME OVER MODAL ─────────────────────────────────── */}
      <Modal visible={isGameOver} transparent animationType="fade">
        <View style={s.overlay}>
          <MotiView
            from={{ scale: 0.78, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={[s.modalBox, { alignItems: 'center' }]}
          >
            <Shield size={52} color="#ef4444" style={{ marginBottom: 14 }} />
            <Text style={s.modalTitle}>PLANET LOST</Text>
            <Text style={[s.modalTag, { marginBottom: 4 }]}>
              WAVE {g.wave} · LV.{g.runLevel}
            </Text>
            <Text style={s.bigScore}>{g.score.toLocaleString()}</Text>
            <Text style={[s.modalTag, { marginBottom: 28 }]}>SCORE</Text>
            <TouchableOpacity
              onPress={exitRun}
              style={[s.modalBtn, { backgroundColor: '#3b82f6' }]}
            >
              <LogOut size={18} color="#fff" />
              <Text style={s.modalBtnTxt}>RETURN TO BASE</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
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
  modalBox: {
    width: '100%',
    backgroundColor: '#0a1120',
    borderRadius: 20,
    padding: 26,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalTag: { color: '#a855f7', fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  modalTitle: { color: '#fff', fontSize: 26, fontFamily: 'Inter_900Black', marginBottom: 6 },
  scoreLabel: { color: '#fbbf24', fontSize: 15, fontFamily: 'Inter_700Bold' },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 12,
  },
  modalBtnTxt: { color: '#fff', fontSize: 16, fontFamily: 'Inter_900Black' },

  augCard: {
    backgroundColor: '#0f1929',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  augLabel: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  augDesc: { color: '#475569', fontSize: 11, fontFamily: 'Inter_700Bold' },

  bigScore: { color: '#3b82f6', fontSize: 46, fontFamily: 'Inter_900Black' },
});
