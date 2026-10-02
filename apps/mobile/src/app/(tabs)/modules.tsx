/**
 * PLAYER MODULE LAB — updated for ModuleInstance system (duplicates supported)
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/utils/gameStore';
import {
  getModuleDef,
  ALL_MODULE_DEFS,
  RARITY_COLOR,
  RARITY_LABEL,
  SlotType,
  calcUpgradeCost,
  ModuleInstance,
} from '@/utils/modules';
import { ArrowUp, X, Lock } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';

const { width } = Dimensions.get('window');
const GRID_COLS = 4;
const SLOT_SIZE = (width - 60) / GRID_COLS;

const ST_COLOR: Record<SlotType, string> = {
  X: '#ef4444',
  V: '#3b82f6',
  C: '#22d3ee',
  E: '#f59e0b',
  O: '#10b981',
};

export default function ModuleLab() {
  const insets = useSafeAreaInsets();
  const {
    gold,
    ownedModules,
    playerEquippedMods,
    equipPlayerMod,
    unequipPlayerMod,
    upgradeModuleInstance,
  } = useGameStore();

  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  const selectedInst = ownedModules.find((m) => m.instanceId === selectedInstanceId) ?? null;
  const selectedDef = selectedInst ? getModuleDef(selectedInst.defId) : null;
  const isEquipped = (instanceId: string) => playerEquippedMods.includes(instanceId);

  const upgradeCost =
    selectedDef && selectedInst ? calcUpgradeCost(selectedDef, selectedInst.level) : 0;
  const canUpgrade = !!(
    selectedDef &&
    selectedInst &&
    selectedInst.level < selectedDef.maxLevel &&
    gold >= upgradeCost
  );

  // Only show player-usable modules
  const playerModDefs = ALL_MODULE_DEFS.filter(
    (d) => d.applicableTo === 'all' || d.applicableTo === 'player'
  );
  const playerInstances: ModuleInstance[] = ownedModules.filter((inst) =>
    playerModDefs.some((d) => d.id === inst.defId)
  );

  const renderCard = (inst: ModuleInstance, size: number = SLOT_SIZE) => {
    const def = getModuleDef(inst.defId);
    if (!def) return null;
    const equipped = isEquipped(inst.instanceId);
    const rColor = RARITY_COLOR[def.rarity];
    const stColor = ST_COLOR[def.slotType];
    const isSelected = selectedInstanceId === inst.instanceId;

    return (
      <TouchableOpacity
        onPress={() => setSelectedInstanceId(isSelected ? null : inst.instanceId)}
        style={{
          width: size,
          height: size,
          backgroundColor: '#0a111e',
          borderRadius: 8,
          borderWidth: 2,
          borderColor: isSelected ? '#3b82f6' : equipped ? rColor : '#1e293b',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 4,
          overflow: 'hidden',
        }}
      >
        <Text style={{ fontSize: size * 0.36 }}>{def.icon}</Text>
        <View style={{ position: 'absolute', bottom: 2, left: 3 }}>
          <Text style={{ color: rColor, fontSize: 7, fontFamily: 'Inter_700Bold' }}>
            Lv.{inst.level}
          </Text>
        </View>
        <View style={{ position: 'absolute', bottom: 2, right: 3 }}>
          <Text style={{ color: stColor, fontSize: 7, fontFamily: 'Inter_900Black' }}>
            {def.slotType}
          </Text>
        </View>
        {equipped && (
          <View
            style={{
              position: 'absolute',
              top: 2,
              left: 2,
              backgroundColor: '#3b82f6',
              borderRadius: 3,
              paddingHorizontal: 3,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 6, fontFamily: 'Inter_900Black' }}>E</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
      <View style={{ padding: 20 }}>
        <Text
          style={{ color: '#fff', fontSize: 24, fontFamily: 'Inter_900Black', marginBottom: 16 }}
        >
          MODULE LAB
        </Text>

        {/* Equipped slots (8 slots, by instanceId) */}
        <View
          style={{
            backgroundColor: '#0a111e',
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#1e293b',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
              EQUIPPED ({playerEquippedMods.length}/8)
            </Text>
            <Text style={{ color: '#fbbf24', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
              {gold.toLocaleString()} 💰
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const iid = playerEquippedMods[i];
              const inst = iid ? ownedModules.find((m) => m.instanceId === iid) : null;
              return (
                <View
                  key={i}
                  style={{
                    width: SLOT_SIZE,
                    height: SLOT_SIZE,
                    margin: 4,
                    backgroundColor: '#050d1a',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#1e293b',
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {inst ? renderCard(inst, SLOT_SIZE - 6) : <Lock size={18} color="#1e293b" />}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Inventory — all player module instances */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#030712',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 20,
        }}
      >
        <Text
          style={{ color: '#334155', fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 12 }}
        >
          PLAYER MODULES ({playerInstances.length} INSTANCES)
        </Text>
        {playerInstances.length === 0 ? (
          <Text
            style={{
              color: '#1e293b',
              textAlign: 'center',
              marginTop: 40,
              fontFamily: 'Inter_700Bold',
            }}
          >
            No modules yet — complete runs to earn them!
          </Text>
        ) : (
          <FlatList
            data={playerInstances}
            numColumns={GRID_COLS}
            keyExtractor={(item) => item.instanceId}
            renderItem={({ item }) => renderCard(item) ?? <View />}
            contentContainerStyle={{ paddingBottom: 200 }}
          />
        )}
      </View>

      {/* Detail overlay */}
      <AnimatePresence>
        {selectedDef && selectedInst && (
          <MotiView
            from={{ translateY: 380 }}
            animate={{ translateY: 0 }}
            exit={{ translateY: 380 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#0a111e',
              padding: 22,
              paddingBottom: insets.bottom + 22,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderWidth: 1,
              borderColor: '#1e293b',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
                MODULE DETAILS
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedInstanceId(null)}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: 20,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: '#334155',
                }}
              >
                <X size={16} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={{ flexDirection: 'row', gap: 14, marginBottom: 16 }}>
              <View
                style={{
                  width: 66,
                  height: 66,
                  backgroundColor: '#050d1a',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: RARITY_COLOR[selectedDef.rarity],
                }}
              >
                <Text style={{ fontSize: 28 }}>{selectedDef.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Inter_900Black' }}>
                    {selectedDef.name}
                  </Text>
                  <View
                    style={{
                      backgroundColor: RARITY_COLOR[selectedDef.rarity] + '33',
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      borderRadius: 5,
                    }}
                  >
                    <Text
                      style={{
                        color: RARITY_COLOR[selectedDef.rarity],
                        fontSize: 8,
                        fontFamily: 'Inter_700Bold',
                      }}
                    >
                      {RARITY_LABEL[selectedDef.rarity]}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: '#475569', fontSize: 11 }}>{selectedDef.description}</Text>
                <Text style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>
                  LV.{selectedInst.level}/{selectedDef.maxLevel} · +
                  {(selectedDef.baseValue * selectedInst.level).toFixed(1)}
                  {selectedDef.unit}
                  {'  ·  '}
                  {selectedDef.powerCost ?? 8} PWR
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: ST_COLOR[selectedDef.slotType] + '22',
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: ST_COLOR[selectedDef.slotType],
                }}
              >
                <Text
                  style={{
                    color: ST_COLOR[selectedDef.slotType],
                    fontSize: 13,
                    fontFamily: 'Inter_900Black',
                  }}
                >
                  {selectedDef.slotType}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() =>
                  isEquipped(selectedInst.instanceId)
                    ? unequipPlayerMod(selectedInst.instanceId)
                    : equipPlayerMod(selectedInst.instanceId)
                }
                style={{
                  flex: 1,
                  height: 50,
                  backgroundColor: isEquipped(selectedInst.instanceId) ? '#ef444422' : '#3b82f622',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isEquipped(selectedInst.instanceId) ? '#ef4444' : '#3b82f6',
                }}
              >
                <Text
                  style={{
                    color: isEquipped(selectedInst.instanceId) ? '#ef4444' : '#3b82f6',
                    fontSize: 14,
                    fontFamily: 'Inter_900Black',
                  }}
                >
                  {isEquipped(selectedInst.instanceId) ? 'UNEQUIP' : 'EQUIP'}
                </Text>
              </TouchableOpacity>

              {selectedInst.level < selectedDef.maxLevel && (
                <TouchableOpacity
                  onPress={() => upgradeModuleInstance(selectedInst.instanceId)}
                  disabled={!canUpgrade}
                  style={{
                    flex: 1,
                    height: 50,
                    backgroundColor: canUpgrade ? '#10b98122' : '#1e293b',
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                    borderWidth: 1,
                    borderColor: canUpgrade ? '#10b981' : '#1e293b',
                  }}
                >
                  <ArrowUp size={15} color={canUpgrade ? '#10b981' : '#334155'} />
                  <Text
                    style={{
                      color: canUpgrade ? '#10b981' : '#334155',
                      fontSize: 13,
                      fontFamily: 'Inter_900Black',
                    }}
                  >
                    {upgradeCost}g
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}
