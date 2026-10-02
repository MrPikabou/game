/**
 * ENCYCLOPEDIA — Bestiary
 * Shows all enemies the player has encountered.
 * Legendary loot only shows if the player has received it at least once.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/utils/gameStore';
import { ALL_ENEMY_DEFS } from '@/utils/enemies';
import { ALL_MATERIAL_DEFS } from '@/utils/materials';
import { DamageType } from '@/utils/enemies/types';
import { X } from 'lucide-react-native';

const DMG_COLOR: Record<DamageType, string> = {
  physical: '#9ca3af',
  electric: '#fbbf24',
  fire: '#f97316',
  ice: '#67e8f9',
  poison: '#4ade80',
  explosive: '#fb923c',
  laser: '#c084fc',
};

const DMG_ICON: Record<DamageType, string> = {
  physical: '⚔️',
  electric: '⚡',
  fire: '🔥',
  ice: '❄️',
  poison: '☣️',
  explosive: '💥',
  laser: '🔮',
};

function MatRarityColor(rarity: string): string {
  if (rarity === 'legendary') return '#f59e0b';
  if (rarity === 'epic') return '#a855f7';
  if (rarity === 'rare') return '#3b82f6';
  return '#9ca3af';
}

export default function Encyclopedia() {
  const insets = useSafeAreaInsets();
  const { killedEnemies, legendaryDropSeen } = useGameStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedDef = selectedId ? ALL_ENEMY_DEFS.find((e) => e.id === selectedId) : null;

  const encountered = ALL_ENEMY_DEFS.filter((e) => (killedEnemies[e.id] ?? 0) > 0);
  const locked = ALL_ENEMY_DEFS.filter((e) => !killedEnemies[e.id]);

  return (
    <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text
          style={{ color: '#fff', fontSize: 22, fontFamily: 'Inter_900Black', marginBottom: 4 }}
        >
          ENCYCLOPEDIA
        </Text>
        <Text style={{ color: '#475569', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
          {encountered.length}/{ALL_ENEMY_DEFS.length} ENEMIES ENCOUNTERED
        </Text>
      </View>

      <FlatList
        data={[...encountered, ...locked]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item: e }) => {
          const kills = killedEnemies[e.id] ?? 0;
          const isLocked = kills === 0;
          const isActive = selectedId === e.id;
          return (
            <TouchableOpacity
              onPress={() => !isLocked && setSelectedId(isActive ? null : e.id)}
              style={{
                flex: 1,
                backgroundColor: isLocked ? '#0a0a0a' : isActive ? '#1a2744' : '#0a111e',
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                borderWidth: 2,
                borderColor: isLocked ? '#1e293b' : isActive ? '#3b82f6' : e.borderColor + '55',
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 6 }}>
                {isLocked ? '❓' : e.icon}
              </Text>
              <Text
                style={{
                  color: isLocked ? '#334155' : '#fff',
                  fontSize: 13,
                  fontFamily: 'Inter_700Bold',
                  textAlign: 'center',
                }}
              >
                {isLocked ? '???' : e.name}
              </Text>
              <Text style={{ color: '#475569', fontSize: 10, textAlign: 'center', marginTop: 2 }}>
                {isLocked ? 'UNDISCOVERED' : `${kills.toLocaleString()} killed`}
              </Text>
              {!isLocked && (
                <View
                  style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 6 }}
                >
                  <View
                    style={{
                      backgroundColor: '#0f172a',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: '#64748b', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
                      {e.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Detail panel */}
      {selectedDef && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#0a111e',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 22,
            paddingBottom: insets.bottom + 22,
            borderWidth: 1,
            borderColor: '#1e293b',
            maxHeight: '75%',
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 40, marginRight: 14 }}>{selectedDef.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Inter_900Black' }}>
                  {selectedDef.name}
                </Text>
                <Text
                  style={{
                    color: selectedDef.borderColor,
                    fontSize: 11,
                    fontFamily: 'Inter_700Bold',
                  }}
                >
                  {selectedDef.category.toUpperCase()} · {killedEnemies[selectedDef.id] ?? 0} kills
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedId(null)}
                style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 8 }}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Base stats */}
            <View
              style={{
                backgroundColor: '#050d1a',
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: '#475569',
                  fontSize: 10,
                  fontFamily: 'Inter_700Bold',
                  marginBottom: 10,
                }}
              >
                BASE STATS
              </Text>
              {[
                ['❤️  Base HP', `${selectedDef.baseHp} + ${selectedDef.hpPerWave}/wave`],
                ['💨 Speed', `${selectedDef.speed} + ${selectedDef.speedPerWave}/wave`],
                ['🛡️  Armor', String(selectedDef.armor)],
                ['📦 Size', `${selectedDef.size}px`],
                ['💔 Base Dmg', String(selectedDef.baseDamage)],
              ].map(([lbl, val]) => (
                <View
                  key={lbl as string}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: '#0f172a',
                  }}
                >
                  <Text style={{ color: '#64748b', fontSize: 12 }}>{lbl as string}</Text>
                  <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
                    {val as string}
                  </Text>
                </View>
              ))}
            </View>

            {/* Weaknesses */}
            {Object.keys(selectedDef.weakTo).length > 0 && (
              <View
                style={{
                  backgroundColor: '#1a0a0a',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: '#7f1d1d',
                }}
              >
                <Text
                  style={{
                    color: '#ef4444',
                    fontSize: 10,
                    fontFamily: 'Inter_700Bold',
                    marginBottom: 8,
                  }}
                >
                  ⬆️ WEAK TO (TAKES MORE DAMAGE)
                </Text>
                {Object.entries(selectedDef.weakTo).map(([dt, mult]) => (
                  <View
                    key={dt}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{DMG_ICON[dt as DamageType]}</Text>
                    <Text
                      style={{
                        color: DMG_COLOR[dt as DamageType],
                        fontSize: 12,
                        fontFamily: 'Inter_700Bold',
                        flex: 1,
                      }}
                    >
                      {dt.toUpperCase()}
                    </Text>
                    <Text style={{ color: '#ef4444', fontSize: 12, fontFamily: 'Inter_900Black' }}>
                      ×{mult}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Resistances */}
            {Object.keys(selectedDef.strongAgainst).length > 0 && (
              <View
                style={{
                  backgroundColor: '#0a1a0a',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: '#15803d',
                }}
              >
                <Text
                  style={{
                    color: '#10b981',
                    fontSize: 10,
                    fontFamily: 'Inter_700Bold',
                    marginBottom: 8,
                  }}
                >
                  ⬇️ RESISTANT TO (TAKES LESS DAMAGE)
                </Text>
                {Object.entries(selectedDef.strongAgainst).map(([dt, mult]) => (
                  <View
                    key={dt}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{DMG_ICON[dt as DamageType]}</Text>
                    <Text
                      style={{
                        color: DMG_COLOR[dt as DamageType],
                        fontSize: 12,
                        fontFamily: 'Inter_700Bold',
                        flex: 1,
                      }}
                    >
                      {dt.toUpperCase()}
                    </Text>
                    <Text style={{ color: '#10b981', fontSize: 12, fontFamily: 'Inter_900Black' }}>
                      ×{mult}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Rewards & drops */}
            <View
              style={{
                backgroundColor: '#050d1a',
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: '#475569',
                  fontSize: 10,
                  fontFamily: 'Inter_700Bold',
                  marginBottom: 10,
                }}
              >
                💰 REWARDS
              </Text>
              <Text style={{ color: '#fbbf24', fontSize: 12, marginBottom: 4 }}>
                ⚙️ {selectedDef.goldReward} gold · {selectedDef.xpReward} XP
              </Text>
              <Text style={{ color: '#a855f7', fontSize: 11, marginBottom: 10 }}>
                Material drop chance: {(selectedDef.materialDropChance * 100).toFixed(0)}%
              </Text>
              <Text
                style={{
                  color: '#334155',
                  fontSize: 10,
                  fontFamily: 'Inter_700Bold',
                  marginBottom: 6,
                }}
              >
                DROP TABLE
              </Text>
              {ALL_MATERIAL_DEFS.slice(0, 6).map((mat) => {
                const isLegendary = mat.rarity === 'legendary';
                const show = !isLegendary || legendaryDropSeen[mat.id];
                return (
                  <View
                    key={mat.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{show ? mat.icon : '❓'}</Text>
                    <Text
                      style={{
                        color: show ? MatRarityColor(mat.rarity) : '#334155',
                        fontSize: 11,
                        flex: 1,
                      }}
                    >
                      {show
                        ? mat.name
                        : isLegendary
                          ? 'LEGENDARY (???  — find one first)'
                          : mat.name}
                    </Text>
                    <Text style={{ color: '#334155', fontSize: 9 }}>
                      {mat.rarity.toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}
