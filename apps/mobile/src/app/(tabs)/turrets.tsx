/**
 * TURRET WORKSHOP
 * Shows 4 turret cards. Tap one to configure its module slots.
 * Module slots show type badge (X/V/C/E/O) and power cost.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore, TurretType, getUsedPower } from '@/utils/gameStore';
import { TURRET_DEFS, getTurretStats } from '@/utils/gameConfig';
import {
  getModuleDef,
  getModulesFor,
  SlotType,
  calcPowerCost,
  RARITY_COLOR,
  RARITY_LABEL,
  ModuleInstance,
} from '@/utils/modules';
import { ArrowUp, TrendingUp, X, Zap, Lock } from 'lucide-react-native';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

const SLOT_CLR: Record<SlotType, string> = {
  X: '#ef4444',
  V: '#3b82f6',
  C: '#22d3ee',
  E: '#f59e0b',
  O: '#10b981',
};
const SLOT_LBL: Record<SlotType, string> = {
  X: 'Offensive',
  V: 'Velocity',
  C: 'Control',
  E: 'Exotic',
  O: 'Utility',
};
const ALL_TYPES: TurretType[] = ['cannon', 'laser', 'missile', 'tesla'];
const PRESTIGE_TYPES: SlotType[] = ['X', 'V', 'C', 'E', 'O'];

// ─────────────────────────────────────────────────────────────
export default function TurretWorkshop() {
  const insets = useSafeAreaInsets();
  const {
    gold,
    ownedModules,
    turretBuilds,
    setTurretSlotInstance,
    upgradeTurretSlotModule,
    prestigeTurret,
  } = useGameStore();

  const [activeTurret, setActiveTurret] = useState<TurretType | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [showModPicker, setShowModPicker] = useState(false);
  const [showPrestige, setShowPrestige] = useState(false);
  const [newSlotType, setNewSlotType] = useState<SlotType>('X');

  // ── Derived state ────────────────────────────────────────
  const build = activeTurret ? turretBuilds[activeTurret] : null;
  const def = activeTurret ? TURRET_DEFS[activeTurret] : null;
  const stats = activeTurret && build ? getTurretStats(activeTurret, build.level) : null;
  const usedPower = build ? getUsedPower(build, ownedModules) : 0;

  // Mods available for active turret
  const eligibleDefs = activeTurret ? getModulesFor(activeTurret) : [];
  const ownedEligible = eligibleDefs.filter((d) => ownedModules.some((o) => o.defId === d.id));

  const handleEquip = (inst: ModuleInstance) => {
    if (activeTurret === null || activeSlot === null) return;
    const curSlot = build!.slots[activeSlot];
    // If same instance → unequip
    const newId = curSlot.instanceId === inst.instanceId ? null : inst.instanceId;
    setTurretSlotInstance(activeTurret, activeSlot, newId);
    setShowModPicker(false);
    setActiveSlot(null);
  };

  const handlePrestige = () => {
    if (!activeTurret) return;
    prestigeTurret(activeTurret, newSlotType);
    setShowPrestige(false);
  };

  // ── GRID VIEW (no turret selected) ──────────────────────
  if (!activeTurret) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text
            style={{ color: '#fff', fontSize: 22, fontFamily: 'Inter_900Black', marginBottom: 4 }}
          >
            TURRET WORKSHOP
          </Text>
          <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
            TAP A TURRET TO CONFIGURE ITS MODULES
          </Text>
        </View>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 2×2 grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {ALL_TYPES.map((tt) => {
              const d = TURRET_DEFS[tt];
              const b = turretBuilds[tt];
              const used = getUsedPower(b, ownedModules);
              const pct = (used / b.maxPower) * 100;
              const filledSlots = b.slots.filter((s) => s.instanceId).length;
              return (
                <TouchableOpacity
                  key={tt}
                  onPress={() => setActiveTurret(tt)}
                  style={{
                    width: (width - 44) / 2,
                    backgroundColor: '#0a111e',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 2,
                    borderColor: d.accentColor + '55',
                  }}
                >
                  {/* Icon + name */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        backgroundColor: d.color,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: d.accentColor,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{d.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ color: d.accentColor, fontSize: 14, fontFamily: 'Inter_900Black' }}
                      >
                        {d.name}
                      </Text>
                      <Text style={{ color: '#334155', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
                        LV.{b.level} {b.prestigeLevel > 0 ? `· P${b.prestigeLevel}⭐` : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Power bar */}
                  <Text
                    style={{
                      color: '#334155',
                      fontSize: 9,
                      fontFamily: 'Inter_700Bold',
                      marginBottom: 4,
                    }}
                  >
                    POWER {used}/{b.maxPower}
                  </Text>
                  <View
                    style={{
                      height: 5,
                      backgroundColor: '#0f172a',
                      borderRadius: 3,
                      overflow: 'hidden',
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${pct}%` as `${number}%`,
                        backgroundColor: pct > 85 ? '#ef4444' : d.accentColor,
                        borderRadius: 3,
                      }}
                    />
                  </View>

                  {/* Module slot pips */}
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {b.slots.map((sl, i) => (
                      <View
                        key={i}
                        style={{
                          flex: 1,
                          height: 18,
                          borderRadius: 4,
                          borderWidth: 1,
                          borderColor: SLOT_CLR[sl.type],
                          backgroundColor: sl.instanceId ? SLOT_CLR[sl.type] + '44' : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: SLOT_CLR[sl.type],
                            fontSize: 7,
                            fontFamily: 'Inter_900Black',
                          }}
                        >
                          {sl.type}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Text style={{ color: '#334155', fontSize: 9, marginTop: 8 }}>
                    {filledSlots}/{b.slots.length} slots filled
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Gold indicator */}
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Zap size={13} color="#fbbf24" />
            <Text style={{ color: '#fbbf24', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
              {gold.toLocaleString()} GOLD AVAILABLE
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── DETAIL VIEW (turret selected) ────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
      {/* Back header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 10,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setActiveTurret(null);
            setActiveSlot(null);
          }}
          style={{
            backgroundColor: '#0f172a',
            borderRadius: 10,
            padding: 9,
            borderWidth: 1,
            borderColor: '#1e293b',
          }}
        >
          <X size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Inter_900Black', flex: 1 }}>
          {def!.icon} {def!.name} WORKSHOP
        </Text>
        <Text style={{ color: '#fbbf24', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
          {gold.toLocaleString()}g
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Turret stat card */}
        <View
          style={{
            backgroundColor: def!.color + '33',
            borderRadius: 14,
            padding: 16,
            borderWidth: 2,
            borderColor: def!.accentColor + '55',
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: def!.color,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: def!.accentColor,
                marginRight: 14,
              }}
            >
              <Text style={{ fontSize: 26 }}>{def!.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: def!.accentColor, fontSize: 18, fontFamily: 'Inter_900Black' }}>
                {def!.name}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 11 }}>{def!.description}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: def!.accentColor, fontSize: 24, fontFamily: 'Inter_900Black' }}>
                LV.{build!.level}
              </Text>
              {build!.prestigeLevel > 0 && (
                <Text style={{ color: '#f59e0b', fontSize: 10, fontFamily: 'Inter_700Bold' }}>
                  P{build!.prestigeLevel}⭐
                </Text>
              )}
            </View>
          </View>

          {/* XP bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Text style={{ color: '#334155', fontSize: 9, fontFamily: 'Inter_700Bold' }}>XP</Text>
            <View
              style={{
                flex: 1,
                height: 5,
                backgroundColor: '#0f172a',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${(build!.xp / (build!.level * 200)) * 100}%` as `${number}%`,
                  backgroundColor: def!.accentColor,
                  borderRadius: 3,
                }}
              />
            </View>
            <Text style={{ color: '#334155', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
              {build!.xp.toFixed(0)}/{build!.level * 200}
            </Text>
          </View>

          {/* Power bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Text style={{ color: '#334155', fontSize: 9, fontFamily: 'Inter_700Bold' }}>PWR</Text>
            <View
              style={{
                flex: 1,
                height: 5,
                backgroundColor: '#0f172a',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${(usedPower / build!.maxPower) * 100}%` as `${number}%`,
                  backgroundColor: usedPower > build!.maxPower * 0.85 ? '#ef4444' : '#10b981',
                  borderRadius: 3,
                }}
              />
            </View>
            <Text style={{ color: '#334155', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
              {usedPower}/{build!.maxPower}
            </Text>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              ['DMG', stats!.damage],
              ['RNG', stats!.range],
              ['SPD', stats!.bulletSpeed || '—'],
            ].map(([lbl, val]) => (
              <View
                key={lbl as string}
                style={{
                  flex: 1,
                  backgroundColor: '#050d1a',
                  borderRadius: 8,
                  padding: 8,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{ color: def!.accentColor, fontSize: 15, fontFamily: 'Inter_900Black' }}
                >
                  {val}
                </Text>
                <Text style={{ color: '#334155', fontSize: 8, fontFamily: 'Inter_700Bold' }}>
                  {lbl as string}
                </Text>
              </View>
            ))}
          </View>

          {build!.level >= build!.maxLevel && (
            <TouchableOpacity
              onPress={() => setShowPrestige(true)}
              style={{
                marginTop: 12,
                backgroundColor: '#f59e0b22',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#f59e0b66',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <TrendingUp size={15} color="#f59e0b" />
              <Text style={{ color: '#f59e0b', fontSize: 12, fontFamily: 'Inter_900Black' }}>
                PRESTIGE — ADD SLOT (MAX LEVEL REACHED)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Module slots */}
        <Text
          style={{ color: '#475569', fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 12 }}
        >
          MODULE SLOTS ({build!.slots.filter((s) => s.instanceId).length}/{build!.slots.length} ·{' '}
          {usedPower}/{build!.maxPower} PWR)
        </Text>

        {build!.slots.map((slot, i) => {
          const inst = slot.instanceId
            ? ownedModules.find((m) => m.instanceId === slot.instanceId)
            : null;
          const modDef = inst ? getModuleDef(inst.defId) : null;
          const typeMatch = modDef ? modDef.slotType === slot.type : false;
          const effPwr = modDef ? calcPowerCost(modDef, slot.type) : 0;
          const isActive = activeSlot === i;
          const upgCost = modDef && inst ? modDef.baseCost + modDef.costPerLevel * inst.level : 0;
          const canUpg = modDef && inst && inst.level < modDef.maxLevel && gold >= upgCost;

          return (
            <MotiView
              key={i}
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginBottom: 10 }}
            >
              <TouchableOpacity
                onPress={() => setActiveSlot(isActive ? null : i)}
                style={{
                  backgroundColor: isActive ? '#0f1929' : '#0a111e',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 2,
                  borderColor: isActive ? SLOT_CLR[slot.type] : '#1e293b',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {/* Type badge */}
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: SLOT_CLR[slot.type] + '22',
                      borderWidth: 1,
                      borderColor: SLOT_CLR[slot.type],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: SLOT_CLR[slot.type],
                        fontSize: 13,
                        fontFamily: 'Inter_900Black',
                      }}
                    >
                      {slot.type}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#475569', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
                      SLOT {i + 1} · {SLOT_LBL[slot.type]}
                    </Text>
                    {modDef && inst ? (
                      <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
                        {modDef.icon} {modDef.name} · LV.{inst.level}
                      </Text>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Lock size={10} color="#334155" />
                        <Text style={{ color: '#334155', fontSize: 11 }}>EMPTY</Text>
                      </View>
                    )}
                  </View>
                  {modDef && (
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text
                        style={{
                          color: typeMatch ? '#10b981' : '#475569',
                          fontSize: 9,
                          fontFamily: 'Inter_700Bold',
                        }}
                      >
                        {effPwr} PWR{typeMatch ? ' (50% OFF)' : ''}
                      </Text>
                      <Text
                        style={{
                          color: RARITY_COLOR[modDef.rarity],
                          fontSize: 8,
                          fontFamily: 'Inter_700Bold',
                        }}
                      >
                        {modDef.slotType}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {isActive && (
                <View
                  style={{
                    backgroundColor: '#050d1a',
                    borderRadius: 10,
                    padding: 10,
                    marginTop: 4,
                    borderWidth: 1,
                    borderColor: '#1e293b',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setShowModPicker(true)}
                    style={{
                      flex: 1,
                      backgroundColor: '#1e293b',
                      borderRadius: 10,
                      paddingVertical: 11,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
                      {modDef ? '🔄 CHANGE' : '+ EQUIP'}
                    </Text>
                  </TouchableOpacity>
                  {modDef && inst && (
                    <>
                      <TouchableOpacity
                        onPress={() => upgradeTurretSlotModule(activeTurret!, i)}
                        disabled={!canUpg}
                        style={{
                          flex: 1,
                          backgroundColor: canUpg ? '#10b98122' : '#0f172a',
                          borderRadius: 10,
                          paddingVertical: 11,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: canUpg ? '#10b981' : '#1e293b',
                        }}
                      >
                        <ArrowUp size={13} color={canUpg ? '#10b981' : '#334155'} />
                        <Text
                          style={{
                            color: canUpg ? '#10b981' : '#334155',
                            fontSize: 9,
                            fontFamily: 'Inter_700Bold',
                            marginTop: 2,
                          }}
                        >
                          {upgCost}g
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setTurretSlotInstance(activeTurret!, i, null)}
                        style={{
                          width: 42,
                          backgroundColor: '#ef444422',
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: '#ef444455',
                        }}
                      >
                        <X size={15} color="#ef4444" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </MotiView>
          );
        })}
      </ScrollView>

      {/* ── MODULE PICKER MODAL ─── */}
      <Modal visible={showModPicker} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000bb' }}>
          <View
            style={{
              backgroundColor: '#0a111e',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '82%',
              borderWidth: 1,
              borderColor: '#1e293b',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 18,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#1e293b',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Inter_900Black', flex: 1 }}>
                EQUIP MODULE — SLOT {activeSlot !== null ? activeSlot + 1 : ''}
                {activeSlot !== null ? ` [${build!.slots[activeSlot].type}]` : ''}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModPicker(false)}
                style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 8 }}
              >
                <X size={15} color="#fff" />
              </TouchableOpacity>
            </View>

            {activeSlot !== null && (
              <View
                style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#050d1a' }}
              >
                <Text style={{ color: '#475569', fontSize: 10 }}>
                  Slot type:{' '}
                  <Text
                    style={{
                      color: SLOT_CLR[build!.slots[activeSlot].type],
                      fontFamily: 'Inter_700Bold',
                    }}
                  >
                    {build!.slots[activeSlot].type} – {SLOT_LBL[build!.slots[activeSlot].type]}
                  </Text>
                  {'  ·  '}Matching type = 50% POWER cost
                </Text>
              </View>
            )}

            <FlatList
              data={ownedModules.filter((inst) => ownedEligible.some((d) => d.id === inst.defId))}
              keyExtractor={(item) => item.instanceId}
              contentContainerStyle={{ padding: 14 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: inst }) => {
                const modDef = getModuleDef(inst.defId)!;
                const slotT = activeSlot !== null ? build!.slots[activeSlot].type : null;
                const match = slotT && modDef.slotType === slotT;
                const pw = slotT ? calcPowerCost(modDef, slotT) : (modDef.powerCost ?? 16);
                const wouldExceed =
                  slotT && build
                    ? getUsedPower(build, ownedModules) -
                        (build.slots[activeSlot!]?.instanceId
                          ? calcPowerCost(
                              getModuleDef(
                                ownedModules.find(
                                  (m) => m.instanceId === build.slots[activeSlot!].instanceId
                                )?.defId ?? ''
                              )!,
                              slotT
                            )
                          : 0) +
                        pw >
                      build.maxPower
                    : false;
                const isCurrent =
                  activeSlot !== null && build!.slots[activeSlot].instanceId === inst.instanceId;

                return (
                  <TouchableOpacity
                    onPress={() => handleEquip(inst)}
                    disabled={wouldExceed && !isCurrent}
                    style={{
                      backgroundColor: isCurrent ? '#0f2a1a' : '#0a1120',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 2,
                      borderColor: isCurrent
                        ? '#10b981'
                        : match
                          ? SLOT_CLR[modDef.slotType] + '66'
                          : '#1e293b',
                      opacity: wouldExceed && !isCurrent ? 0.4 : 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 22 }}>{modDef.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 2,
                          }}
                        >
                          <Text
                            style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' }}
                          >
                            {modDef.name}
                          </Text>
                          <View
                            style={{
                              backgroundColor: RARITY_COLOR[modDef.rarity] + '33',
                              paddingHorizontal: 5,
                              paddingVertical: 1,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                color: RARITY_COLOR[modDef.rarity],
                                fontSize: 7,
                                fontFamily: 'Inter_700Bold',
                              }}
                            >
                              {RARITY_LABEL[modDef.rarity]}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ color: '#475569', fontSize: 9 }}>
                          LV.{inst.level} · +{(modDef.baseValue * inst.level).toFixed(1)}
                          {modDef.unit}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 3 }}>
                        <View
                          style={{
                            backgroundColor: SLOT_CLR[modDef.slotType] + '33',
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: SLOT_CLR[modDef.slotType],
                          }}
                        >
                          <Text
                            style={{
                              color: SLOT_CLR[modDef.slotType],
                              fontSize: 10,
                              fontFamily: 'Inter_900Black',
                            }}
                          >
                            {modDef.slotType}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: match ? '#10b981' : '#475569',
                            fontSize: 9,
                            fontFamily: 'Inter_700Bold',
                          }}
                        >
                          {pw} PWR{match ? ' ↓50%' : ''}
                        </Text>
                        {wouldExceed && !isCurrent && (
                          <Text
                            style={{ color: '#ef4444', fontSize: 8, fontFamily: 'Inter_700Bold' }}
                          >
                            OVER PWR
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── PRESTIGE MODAL ─── */}
      <Modal visible={showPrestige} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: '#000000cc',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 22,
          }}
        >
          <MotiView
            from={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              width: '100%',
              backgroundColor: '#0a111e',
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: '#f59e0b55',
            }}
          >
            <Text
              style={{
                color: '#f59e0b',
                fontSize: 12,
                fontFamily: 'Inter_700Bold',
                marginBottom: 4,
              }}
            >
              TURRET PRESTIGE
            </Text>
            <Text
              style={{ color: '#fff', fontSize: 20, fontFamily: 'Inter_900Black', marginBottom: 8 }}
            >
              {def?.icon} {def?.name} — P{(build?.prestigeLevel ?? 0) + 1}
            </Text>
            <Text style={{ color: '#475569', fontSize: 12, marginBottom: 20 }}>
              Resets to LV.1 but unlocks a new module slot (+20 max power). Choose its type:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
              {PRESTIGE_TYPES.map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setNewSlotType(st)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 2,
                    backgroundColor: newSlotType === st ? SLOT_CLR[st] + '33' : '#0f172a',
                    borderColor: newSlotType === st ? SLOT_CLR[st] : '#1e293b',
                  }}
                >
                  <Text
                    style={{
                      color: newSlotType === st ? SLOT_CLR[st] : '#475569',
                      fontSize: 13,
                      fontFamily: 'Inter_900Black',
                    }}
                  >
                    {st}
                  </Text>
                  <Text style={{ color: '#334155', fontSize: 9 }}>{SLOT_LBL[st]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowPrestige(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#0f172a',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#334155',
                }}
              >
                <Text style={{ color: '#475569', fontSize: 14, fontFamily: 'Inter_900Black' }}>
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePrestige}
                style={{
                  flex: 1,
                  backgroundColor: '#f59e0b',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#000', fontSize: 14, fontFamily: 'Inter_900Black' }}>
                  PRESTIGE ⭐
                </Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
}
