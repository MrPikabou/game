/**
 * TURRET MODULE LAB
 * Configure each turret's module slots, upgrade mods, and prestige.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore, TurretType } from '@/utils/gameStore';
import { TURRET_DEFS, getTurretStats } from '@/utils/gameConfig';
import {
  getModulesFor,
  getModuleDef,
  SlotType,
  ModuleDef,
  calcModuleCost,
  RARITY_COLOR,
  RARITY_LABEL,
} from '@/utils/modules';
import { ArrowUp, TrendingUp, X, ChevronRight, Lock } from 'lucide-react-native';
import { MotiView } from 'moti';

const SLOT_TYPE_COLORS: Record<SlotType, string> = {
  X: '#ef4444',
  V: '#3b82f6',
  C: '#22d3ee',
  E: '#f59e0b',
  O: '#10b981',
};

const SLOT_TYPE_LABELS: Record<SlotType, string> = {
  X: 'X – Offensive',
  V: 'V – Velocity',
  C: 'C – Control',
  E: 'E – Exotic',
  O: 'O – Utility',
};

const ALL_TURRET_TYPES: TurretType[] = ['cannon', 'laser', 'missile', 'tesla'];
const PRESTIGE_SLOT_TYPES: SlotType[] = ['X', 'V', 'C', 'E', 'O'];

// ─────────────────────────────────────────────────────────────
export default function TurretLabScreen() {
  const insets = useSafeAreaInsets();
  const { gold, turretBuilds, ownedModules, setTurretModSlot, upgradeTurretMod, prestigeTurret } =
    useGameStore();

  const [selectedTurret, setSelectedTurret] = useState<TurretType>('cannon');
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [showModPicker, setShowModPicker] = useState(false);
  const [showPrestige, setShowPrestige] = useState(false);
  const [pickedSlotType, setPickedSlotType] = useState<SlotType>('X');

  const build = turretBuilds[selectedTurret];
  const def = TURRET_DEFS[selectedTurret];
  const stats = getTurretStats(selectedTurret, build.level);
  const isMaxLevel = build.level >= build.maxLevel;
  const xpProgress = (build.xp / (build.level * 200)) * 100;

  // Modules this turret can use
  const eligibleMods = getModulesFor(selectedTurret);

  // ── Equip a module into the selected slot ──────────────────
  const handlePickModule = (modDef: ModuleDef) => {
    if (selectedSlotIdx === null) return;
    // If already equipped in this slot, unequip; otherwise equip
    const slot = build.slots[selectedSlotIdx];
    const newId = slot.moduleDefId === modDef.id ? null : modDef.id;
    setTurretModSlot(selectedTurret, selectedSlotIdx, newId);
    setShowModPicker(false);
    setSelectedSlotIdx(null);
  };

  // ── Upgrade the module in a slot ──────────────────────────
  const handleUpgrade = (slotIdx: number) => {
    upgradeTurretMod(selectedTurret, slotIdx);
  };

  // ── Prestige the turret ───────────────────────────────────
  const handlePrestige = () => {
    prestigeTurret(selectedTurret, pickedSlotType);
    setShowPrestige(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
      {/* ── TURRET SELECTOR TABS ─────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text
          style={{ color: '#fff', fontSize: 22, fontFamily: 'Inter_900Black', marginBottom: 14 }}
        >
          TURRET LAB
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {ALL_TURRET_TYPES.map((tt) => {
            const d = TURRET_DEFS[tt];
            const active = selectedTurret === tt;
            const b = turretBuilds[tt];
            return (
              <TouchableOpacity
                key={tt}
                onPress={() => {
                  setSelectedTurret(tt);
                  setSelectedSlotIdx(null);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  backgroundColor: active ? d.color : '#0f172a',
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: active ? d.accentColor : '#1e293b',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 18 }}>{d.icon}</Text>
                <Text
                  style={{
                    color: active ? d.accentColor : '#475569',
                    fontSize: 8,
                    fontFamily: 'Inter_900Black',
                    marginTop: 2,
                  }}
                >
                  LV.{b.level}
                </Text>
                {b.prestigeLevel > 0 && (
                  <View style={{ position: 'absolute', top: 4, right: 4 }}>
                    <Text style={{ fontSize: 8 }}>⭐</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TURRET STAT CARD ─────────────────────────────────── */}
        <View
          style={{
            backgroundColor: def.color + '33',
            borderRadius: 14,
            padding: 16,
            borderWidth: 2,
            borderColor: def.accentColor + '55',
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 36, marginRight: 14 }}>{def.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: def.accentColor, fontSize: 18, fontFamily: 'Inter_900Black' }}>
                {def.name}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
                {def.description}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: def.accentColor, fontSize: 22, fontFamily: 'Inter_900Black' }}>
                LV.{build.level}
              </Text>
              {build.prestigeLevel > 0 && (
                <Text style={{ color: '#f59e0b', fontSize: 10, fontFamily: 'Inter_700Bold' }}>
                  P{build.prestigeLevel} ⭐
                </Text>
              )}
            </View>
          </View>

          {/* XP bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Text style={{ color: '#475569', fontSize: 9, fontFamily: 'Inter_700Bold' }}>XP</Text>
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
                  width: `${xpProgress}%` as `${number}%`,
                  height: '100%',
                  backgroundColor: def.accentColor,
                  borderRadius: 3,
                }}
              />
            </View>
            <Text style={{ color: '#475569', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
              {build.xp.toFixed(0)}/{build.level * 200}
            </Text>
          </View>

          {/* Stat grid */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'DMG', value: stats.damage },
              { label: 'SPEED', value: stats.bulletSpeed },
              { label: 'RANGE', value: stats.range },
            ].map((st) => (
              <View
                key={st.label}
                style={{
                  flex: 1,
                  backgroundColor: '#0a111e',
                  borderRadius: 8,
                  padding: 8,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{ color: def.accentColor, fontSize: 15, fontFamily: 'Inter_900Black' }}
                >
                  {st.value}
                </Text>
                <Text style={{ color: '#334155', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
                  {st.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Prestige button */}
          {isMaxLevel && (
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
              <TrendingUp size={16} color="#f59e0b" />
              <Text style={{ color: '#f59e0b', fontSize: 13, fontFamily: 'Inter_900Black' }}>
                PRESTIGE TURRET (+1 SLOT)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── MODULE SLOTS ─────────────────────────────────────── */}
        <Text
          style={{ color: '#475569', fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 12 }}
        >
          MODULE SLOTS ({build.slots.filter((sl) => sl.moduleDefId !== null).length}/
          {build.slots.length} FILLED)
        </Text>

        {build.slots.map((slot, i) => {
          const modDef = slot.moduleDefId ? getModuleDef(slot.moduleDefId) : null;
          const owned = slot.moduleDefId
            ? ownedModules.find((m) => m.defId === slot.moduleDefId)
            : null;
          const typeMatch = modDef && modDef.slotType === slot.type;
          const upgradeLevel = owned ? owned.level + 1 : 1;
          const upgradeCost =
            modDef && owned ? calcModuleCost(modDef, upgradeLevel, slot.type) : null;
          const canUpgrade =
            modDef && owned && owned.level < modDef.maxLevel && gold >= (upgradeCost ?? Infinity);
          const slotColor = SLOT_TYPE_COLORS[slot.type];
          const isSelected = selectedSlotIdx === i;

          return (
            <MotiView
              key={i}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 250, delay: i * 40 }}
              style={{ marginBottom: 10 }}
            >
              <TouchableOpacity
                onPress={() => {
                  setSelectedSlotIdx(isSelected ? null : i);
                  setShowModPicker(false);
                }}
                style={{
                  backgroundColor: isSelected ? '#0f1929' : '#0a0f1a',
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? slotColor : '#1e293b',
                  padding: 12,
                }}
              >
                {/* Slot header */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: modDef ? 8 : 0,
                  }}
                >
                  {/* Slot type badge */}
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      backgroundColor: slotColor + '33',
                      borderWidth: 1,
                      borderColor: slotColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ color: slotColor, fontSize: 11, fontFamily: 'Inter_900Black' }}>
                      {slot.type}
                    </Text>
                  </View>
                  <Text
                    style={{ color: '#475569', fontSize: 10, fontFamily: 'Inter_700Bold', flex: 1 }}
                  >
                    SLOT {i + 1} · {SLOT_TYPE_LABELS[slot.type]}
                  </Text>
                  {modDef ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {typeMatch && (
                        <View
                          style={{
                            backgroundColor: '#10b98133',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{ color: '#10b981', fontSize: 8, fontFamily: 'Inter_700Bold' }}
                          >
                            50% OFF
                          </Text>
                        </View>
                      )}
                      <ChevronRight size={14} color="#334155" />
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Lock size={12} color="#334155" />
                      <Text style={{ color: '#334155', fontSize: 10, fontFamily: 'Inter_700Bold' }}>
                        EMPTY
                      </Text>
                    </View>
                  )}
                </View>

                {/* Equipped module info */}
                {modDef && owned && (
                  <View style={{ backgroundColor: '#050d1a', borderRadius: 8, padding: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 18, marginRight: 8 }}>{modDef.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={{ color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' }}
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
                                fontSize: 8,
                                fontFamily: 'Inter_700Bold',
                              }}
                            >
                              {RARITY_LABEL[modDef.rarity]}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{ color: '#475569', fontSize: 10, fontFamily: 'Inter_700Bold' }}
                        >
                          LV.{owned.level}/{modDef.maxLevel} · +
                          {(modDef.baseValue * owned.level).toFixed(1)}
                          {modDef.unit}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: SLOT_TYPE_COLORS[modDef.slotType],
                          fontSize: 13,
                          fontFamily: 'Inter_900Black',
                        }}
                      >
                        {modDef.slotType}
                      </Text>
                    </View>
                    <Text style={{ color: '#334155', fontSize: 10, fontFamily: 'Inter_700Bold' }}>
                      {modDef.description}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Expanded actions when slot is selected */}
              {isSelected && (
                <View
                  style={{
                    backgroundColor: '#050d1a',
                    borderRadius: 10,
                    padding: 12,
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
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
                      {modDef ? '🔄 CHANGE' : '+ EQUIP'}
                    </Text>
                  </TouchableOpacity>

                  {modDef && owned && (
                    <>
                      <TouchableOpacity
                        onPress={() => handleUpgrade(i)}
                        disabled={!canUpgrade}
                        style={{
                          flex: 1,
                          backgroundColor: canUpgrade ? '#10b98122' : '#0f172a',
                          borderRadius: 10,
                          paddingVertical: 12,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: canUpgrade ? '#10b981' : '#1e293b',
                        }}
                      >
                        <ArrowUp size={13} color={canUpgrade ? '#10b981' : '#334155'} />
                        <Text
                          style={{
                            color: canUpgrade ? '#10b981' : '#334155',
                            fontSize: 10,
                            fontFamily: 'Inter_700Bold',
                            marginTop: 2,
                          }}
                        >
                          UPGRADE {upgradeCost}g{typeMatch ? ' (50%)' : ''}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setTurretModSlot(selectedTurret, i, null)}
                        style={{
                          width: 44,
                          backgroundColor: '#ef444422',
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: '#ef444455',
                        }}
                      >
                        <X size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </MotiView>
          );
        })}

        {/* Gold indicator */}
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#fbbf24', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
            💰 {gold.toLocaleString()} GOLD
          </Text>
          <Text style={{ color: '#334155', fontSize: 11 }}>
            · Slot type match = 50% off upgrades
          </Text>
        </View>
      </ScrollView>

      {/* ── MODULE PICKER MODAL ──────────────────────────────── */}
      <Modal visible={showModPicker} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000bb' }}>
          <View
            style={{
              backgroundColor: '#0a111e',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '80%',
              borderWidth: 1,
              borderColor: '#1e293b',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 20,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#1e293b',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Inter_900Black', flex: 1 }}>
                EQUIP MODULE — SLOT {selectedSlotIdx !== null ? selectedSlotIdx + 1 : ''}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModPicker(false)}
                style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 8 }}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedSlotIdx !== null && (
              <View
                style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#050d1a' }}
              >
                <Text style={{ color: '#475569', fontSize: 10, fontFamily: 'Inter_700Bold' }}>
                  SLOT TYPE:{' '}
                  <Text style={{ color: SLOT_TYPE_COLORS[build.slots[selectedSlotIdx].type] }}>
                    {SLOT_TYPE_LABELS[build.slots[selectedSlotIdx].type]}
                  </Text>
                  {'  '}·{'  '}Matching slotType = 50% upgrade cost
                </Text>
              </View>
            )}

            <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {eligibleMods.length === 0 ? (
                <Text style={{ color: '#334155', textAlign: 'center', padding: 20 }}>
                  No modules owned for this turret yet
                </Text>
              ) : null}

              {eligibleMods.map((modDef) => {
                const owned = ownedModules.find((m) => m.defId === modDef.id);
                if (!owned) return null; // only show owned modules

                const slotType =
                  selectedSlotIdx !== null ? build.slots[selectedSlotIdx].type : null;
                const typeMatch = modDef.slotType === slotType;
                const currentlyEquipped =
                  build.slots[selectedSlotIdx ?? -1]?.moduleDefId === modDef.id;

                return (
                  <TouchableOpacity
                    key={modDef.id}
                    onPress={() => handlePickModule(modDef)}
                    style={{
                      backgroundColor: currentlyEquipped ? '#0f2a1a' : '#0a1120',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 2,
                      borderColor: currentlyEquipped
                        ? '#10b981'
                        : typeMatch
                          ? SLOT_TYPE_COLORS[modDef.slotType] + '55'
                          : '#1e293b',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 22, marginRight: 10 }}>{modDef.icon}</Text>
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
                            style={{ color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' }}
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
                                fontSize: 8,
                                fontFamily: 'Inter_700Bold',
                              }}
                            >
                              {RARITY_LABEL[modDef.rarity]}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{ color: '#475569', fontSize: 10, fontFamily: 'Inter_700Bold' }}
                        >
                          LV.{owned.level} · +{(modDef.baseValue * owned.level).toFixed(1)}
                          {modDef.unit} · {modDef.description}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 3 }}>
                        <View
                          style={{
                            backgroundColor: SLOT_TYPE_COLORS[modDef.slotType] + '33',
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: SLOT_TYPE_COLORS[modDef.slotType],
                          }}
                        >
                          <Text
                            style={{
                              color: SLOT_TYPE_COLORS[modDef.slotType],
                              fontSize: 11,
                              fontFamily: 'Inter_900Black',
                            }}
                          >
                            {modDef.slotType}
                          </Text>
                        </View>
                        {typeMatch && (
                          <Text
                            style={{ color: '#10b981', fontSize: 8, fontFamily: 'Inter_700Bold' }}
                          >
                            50% OFF
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── PRESTIGE MODAL ───────────────────────────────────── */}
      <Modal visible={showPrestige} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: '#000000cc',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
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
              style={{ color: '#fff', fontSize: 22, fontFamily: 'Inter_900Black', marginBottom: 6 }}
            >
              {def.name} — PRESTIGE {build.prestigeLevel + 1}
            </Text>
            <Text style={{ color: '#475569', fontSize: 12, marginBottom: 24 }}>
              Resets turret to LV.1 but unlocks a new module slot. Choose its type:
            </Text>

            <Text
              style={{
                color: '#334155',
                fontSize: 11,
                fontFamily: 'Inter_700Bold',
                marginBottom: 10,
              }}
            >
              NEW SLOT TYPE
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {PRESTIGE_SLOT_TYPES.map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setPickedSlotType(st)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 2,
                    backgroundColor:
                      pickedSlotType === st ? SLOT_TYPE_COLORS[st] + '33' : '#0f172a',
                    borderColor: pickedSlotType === st ? SLOT_TYPE_COLORS[st] : '#1e293b',
                  }}
                >
                  <Text
                    style={{
                      color: pickedSlotType === st ? SLOT_TYPE_COLORS[st] : '#475569',
                      fontSize: 13,
                      fontFamily: 'Inter_900Black',
                    }}
                  >
                    {st}
                  </Text>
                  <Text style={{ color: '#334155', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
                    {SLOT_TYPE_LABELS[st].split('–')[1].trim()}
                  </Text>
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
