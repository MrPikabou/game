/**
 * PLAYER MODULE LAB
 * Equip and upgrade modules for the player character.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/utils/gameStore';
import {
  ALL_MODULE_DEFS,
  getModuleDef,
  ModuleDef,
  RARITY_COLOR,
  RARITY_LABEL,
  SlotType,
  calcModuleCost,
} from '@/utils/modules';
import { ArrowUp, X, Lock } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';

const { width } = Dimensions.get('window');
const GRID_COLS = 4;
const SLOT_SIZE = (width - 60) / GRID_COLS;

const SLOT_TYPE_COLORS: Record<SlotType, string> = {
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
    upgradePlayerMod,
  } = useGameStore();

  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);

  const selectedDef = selectedDefId ? getModuleDef(selectedDefId) : null;
  const selectedOwned = ownedModules.find((m) => m.defId === selectedDefId) ?? null;
  const isEquipped = (defId: string) => playerEquippedMods.includes(defId);

  const upgradeCost =
    selectedDef && selectedOwned ? calcModuleCost(selectedDef, selectedOwned.level + 1, null) : 0;
  const canUpgrade = !!(
    selectedDef &&
    selectedOwned &&
    selectedOwned.level < selectedDef.maxLevel &&
    gold >= upgradeCost
  );

  const renderCard = (def: ModuleDef, size: number = SLOT_SIZE) => {
    const owned = ownedModules.find((m) => m.defId === def.id);
    const equipped = isEquipped(def.id);
    const rColor = RARITY_COLOR[def.rarity];
    const stColor = SLOT_TYPE_COLORS[def.slotType];
    const isSelected = selectedDefId === def.id;

    return (
      <TouchableOpacity
        onPress={() => setSelectedDefId(isSelected ? null : def.id)}
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
        <Text style={{ fontSize: size * 0.38 }}>{def.icon}</Text>
        <View style={{ position: 'absolute', bottom: 2, left: 4 }}>
          <Text style={{ color: rColor, fontSize: 8, fontFamily: 'Inter_700Bold' }}>
            {owned ? `Lv.${owned.level}` : '🔒'}
          </Text>
        </View>
        <View style={{ position: 'absolute', bottom: 2, right: 4 }}>
          <Text style={{ color: stColor, fontSize: 8, fontFamily: 'Inter_900Black' }}>
            {def.slotType}
          </Text>
        </View>
        {equipped && (
          <View
            style={{
              position: 'absolute',
              top: 2,
              left: 3,
              backgroundColor: '#3b82f6',
              borderRadius: 3,
              paddingHorizontal: 3,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 7, fontFamily: 'Inter_900Black' }}>E</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Only show modules the player owns OR can apply ('all' | 'player')
  const playerMods = ALL_MODULE_DEFS.filter(
    (d) => d.applicableTo === 'all' || d.applicableTo === 'player'
  );
  const ownedPlayerMods = playerMods.filter((d) => ownedModules.some((o) => o.defId === d.id));

  return (
    <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
      <View style={{ padding: 20 }}>
        <Text
          style={{ color: '#fff', fontSize: 24, fontFamily: 'Inter_900Black', marginBottom: 20 }}
        >
          MODULE LAB
        </Text>

        {/* Equipped slots */}
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
              const defId = playerEquippedMods[i];
              const def = defId ? getModuleDef(defId) : null;
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
                  {def ? renderCard(def, SLOT_SIZE - 6) : <Lock size={18} color="#1e293b" />}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Collected modules inventory */}
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
          style={{ color: '#334155', fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 14 }}
        >
          PLAYER MODULES ({ownedPlayerMods.length} OWNED)
        </Text>
        {ownedPlayerMods.length === 0 ? (
          <Text
            style={{
              color: '#1e293b',
              textAlign: 'center',
              marginTop: 40,
              fontFamily: 'Inter_700Bold',
            }}
          >
            No modules yet — earn them in runs!
          </Text>
        ) : (
          <FlatList
            data={ownedPlayerMods}
            numColumns={GRID_COLS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderCard(item)}
            contentContainerStyle={{ paddingBottom: 180 }}
          />
        )}
      </View>

      {/* Detail / action overlay */}
      <AnimatePresence>
        {selectedDef && (
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
                marginBottom: 18,
              }}
            >
              <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
                MODULE DETAILS
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedDefId(null)}
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
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 18 }}>
              <View
                style={{
                  width: 70,
                  height: 70,
                  backgroundColor: '#050d1a',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: RARITY_COLOR[selectedDef.rarity],
                }}
              >
                <Text style={{ fontSize: 30 }}>{selectedDef.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}
                >
                  <Text style={{ color: '#fff', fontSize: 17, fontFamily: 'Inter_900Black' }}>
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
                {selectedOwned && (
                  <Text style={{ color: '#334155', fontSize: 11, marginTop: 2 }}>
                    LV.{selectedOwned.level}/{selectedDef.maxLevel} · +
                    {(selectedDef.baseValue * selectedOwned.level).toFixed(1)}
                    {selectedDef.unit}
                  </Text>
                )}
              </View>
              <View
                style={{
                  backgroundColor: SLOT_TYPE_COLORS[selectedDef.slotType] + '22',
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: SLOT_TYPE_COLORS[selectedDef.slotType],
                }}
              >
                <Text
                  style={{
                    color: SLOT_TYPE_COLORS[selectedDef.slotType],
                    fontSize: 13,
                    fontFamily: 'Inter_900Black',
                  }}
                >
                  {selectedDef.slotType}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {selectedOwned && (
                <TouchableOpacity
                  onPress={() =>
                    isEquipped(selectedDef.id)
                      ? unequipPlayerMod(selectedDef.id)
                      : equipPlayerMod(selectedDef.id)
                  }
                  style={{
                    flex: 1,
                    height: 52,
                    backgroundColor: isEquipped(selectedDef.id) ? '#ef444422' : '#3b82f622',
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isEquipped(selectedDef.id) ? '#ef4444' : '#3b82f6',
                  }}
                >
                  <Text
                    style={{
                      color: isEquipped(selectedDef.id) ? '#ef4444' : '#3b82f6',
                      fontSize: 14,
                      fontFamily: 'Inter_900Black',
                    }}
                  >
                    {isEquipped(selectedDef.id) ? 'UNEQUIP' : 'EQUIP'}
                  </Text>
                </TouchableOpacity>
              )}
              {selectedOwned && selectedOwned.level < selectedDef.maxLevel && (
                <TouchableOpacity
                  onPress={() => upgradePlayerMod(selectedDef.id)}
                  disabled={!canUpgrade}
                  style={{
                    flex: 1,
                    height: 52,
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
                  <ArrowUp size={16} color={canUpgrade ? '#10b981' : '#334155'} />
                  <Text
                    style={{
                      color: canUpgrade ? '#10b981' : '#334155',
                      fontSize: 14,
                      fontFamily: 'Inter_900Black',
                    }}
                  >
                    UPGRADE {upgradeCost}g
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
