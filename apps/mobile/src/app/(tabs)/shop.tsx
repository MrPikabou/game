/**
 * SHOP — Buy materials and bundles with gold
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/utils/gameStore';
import { MAT_RARITY_COLOR } from '@/utils/materials/types';
import { CheckCircle } from 'lucide-react-native';

interface ShopItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  goldCost?: number;
  premiumCost?: number;
  materialId?: string;
  materialQty?: number;
  goldGain?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  tag?: string;
}

const SHOP_ITEMS: ShopItem[] = [
  // Common bundles
  {
    id: 's_scrap_5',
    name: '5× Iron Scrap',
    icon: '🔩',
    description: 'Basic crafting material',
    goldCost: 80,
    materialId: 'iron_scrap',
    materialQty: 5,
    rarity: 'common',
  },
  {
    id: 's_wire_3',
    name: '3× Copper Wire',
    icon: '🔌',
    description: 'Useful connector material',
    goldCost: 90,
    materialId: 'copper_wire',
    materialQty: 3,
    rarity: 'common',
  },
  {
    id: 's_energy_3',
    name: '3× Energy Cell',
    icon: '⚡',
    description: 'Power source',
    goldCost: 100,
    materialId: 'energy_cell',
    materialQty: 3,
    rarity: 'common',
  },
  {
    id: 's_bio_2',
    name: '2× Bio-Fiber',
    icon: '🧬',
    description: 'Organic compound',
    goldCost: 90,
    materialId: 'bio_fiber',
    materialQty: 2,
    rarity: 'common',
  },
  {
    id: 's_nano_2',
    name: '2× Nano Dust',
    icon: '🔬',
    description: 'Micro-particle compound',
    goldCost: 110,
    materialId: 'nano_dust',
    materialQty: 2,
    rarity: 'common',
  },
  // Rare materials
  {
    id: 's_plasma_1',
    name: '1× Plasma Core',
    icon: '🧪',
    description: 'High-energy cell',
    goldCost: 350,
    materialId: 'plasma_core',
    materialQty: 1,
    rarity: 'rare',
    tag: 'HOT',
  },
  {
    id: 's_cryo_1',
    name: '1× Cryo Crystal',
    icon: '❄️',
    description: 'Frozen energy shard',
    goldCost: 380,
    materialId: 'cryo_crystal',
    materialQty: 1,
    rarity: 'rare',
  },
  {
    id: 's_neural_1',
    name: '1× Neural Matrix',
    icon: '🧠',
    description: 'AI processing core',
    goldCost: 420,
    materialId: 'neural_matrix',
    materialQty: 1,
    rarity: 'rare',
  },
  // Epic materials
  {
    id: 's_void_1',
    name: '1× Void Shard',
    icon: '💎',
    description: 'Dark energy fragment',
    goldCost: 800,
    materialId: 'void_shard',
    materialQty: 1,
    rarity: 'epic',
    tag: 'RARE FIND',
  },
  {
    id: 's_quantum_1',
    name: '1× Quantum Filament',
    icon: '🌀',
    description: 'Quantum-entangled thread',
    goldCost: 1000,
    materialId: 'quantum_filament',
    materialQty: 1,
    rarity: 'epic',
  },
  // Legendary (premium only)
  {
    id: 's_titan_p',
    name: '1× Titan Alloy',
    icon: '⚙️',
    description: 'Nearly indestructible',
    premiumCost: 50,
    materialId: 'titan_alloy',
    materialQty: 1,
    rarity: 'legendary',
    tag: 'PREMIUM',
  },
  {
    id: 's_stellar_p',
    name: '1× Stellar Fragment',
    icon: '🌟',
    description: 'Remnant of a collapsed star',
    premiumCost: 80,
    materialId: 'stellar_fragment',
    materialQty: 1,
    rarity: 'legendary',
    tag: 'PREMIUM',
  },
  {
    id: 's_dark_p',
    name: '1× Dark Matter Core',
    icon: '🌑',
    description: 'Rarest substance known',
    premiumCost: 150,
    materialId: 'dark_matter_core',
    materialQty: 1,
    rarity: 'legendary',
    tag: 'PREMIUM',
  },
  // Gold bundles
  {
    id: 's_gold_500',
    name: '500 Gold',
    icon: '💰',
    description: 'Quick gold injection',
    premiumCost: 20,
    goldGain: 500,
    rarity: 'common',
  },
  {
    id: 's_gold_2000',
    name: '2000 Gold',
    icon: '💰',
    description: 'Large gold bundle',
    premiumCost: 60,
    goldGain: 2000,
    rarity: 'rare',
    tag: 'BEST VALUE',
  },
];

const RARITY_BG: Record<string, string> = {
  common: '#0a111e',
  rare: '#0a0e1e',
  epic: '#120a1e',
  legendary: '#1a100a',
};
const RARITY_BORDER: Record<string, string> = {
  common: '#1e293b',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export default function Shop() {
  const insets = useSafeAreaInsets();
  const { gold, materials, addGold, addMaterials } = useGameStore();
  const [bought, setBought] = useState<Set<string>>(new Set());

  const handleBuy = (item: ShopItem) => {
    if (item.premiumCost) {
      Alert.alert(
        'PREMIUM',
        `This item costs ${item.premiumCost} 💠 premium currency.\n\nPremium shop coming soon!`
      );
      return;
    }
    if (!item.goldCost) return;
    if (gold < item.goldCost) {
      Alert.alert('NOT ENOUGH GOLD', `Need ${item.goldCost}g, you have ${gold}g.`);
      return;
    }
    Alert.alert(`BUY ${item.name}?`, `Cost: ${item.goldCost} gold`, [
      { text: 'CANCEL', style: 'cancel' },
      {
        text: 'BUY',
        onPress: () => {
          addGold(-item.goldCost!);
          if (item.materialId) addMaterials({ [item.materialId]: item.materialQty ?? 1 });
          if (item.goldGain) addGold(item.goldGain);
          setBought((prev) => new Set([...prev, item.id]));
          setTimeout(
            () =>
              setBought((prev) => {
                const n = new Set(prev);
                n.delete(item.id);
                return n;
              }),
            2000
          );
        },
      },
    ]);
  };

  const matOwned = (id: string | undefined) => (id ? (materials[id] ?? 0) : 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <View>
          <Text
            style={{ color: '#fff', fontSize: 22, fontFamily: 'Inter_900Black', marginBottom: 2 }}
          >
            SHOP
          </Text>
          <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
            BUY MATERIALS & UPGRADES
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ color: '#fbbf24', fontSize: 14, fontFamily: 'Inter_700Bold' }}>
            💰 {gold.toLocaleString()}
          </Text>
          <Text style={{ color: '#60a5fa', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
            💠 0 (premium)
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium note */}
        <View
          style={{
            backgroundColor: '#0a0e1e',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#60a5fa55',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 20 }}>💠</Text>
          <Text style={{ color: '#60a5fa', fontSize: 11, flex: 1 }}>
            Premium currency coming soon. Legendary materials are purchasable only with 💠.
          </Text>
        </View>

        {['common', 'rare', 'epic', 'legendary'].map((rarity) => {
          const items = SHOP_ITEMS.filter((i) => i.rarity === rarity);
          return (
            <View key={rarity} style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: MAT_RARITY_COLOR[rarity as keyof typeof MAT_RARITY_COLOR],
                  fontSize: 11,
                  fontFamily: 'Inter_700Bold',
                  marginBottom: 10,
                  letterSpacing: 1,
                }}
              >
                ── {rarity.toUpperCase()} ──
              </Text>
              {items.map((item) => {
                const justBought = bought.has(item.id);
                const canAfford = item.goldCost ? gold >= item.goldCost : true;
                return (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: RARITY_BG[rarity] ?? '#0a111e',
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 10,
                      borderWidth: 2,
                      borderColor: RARITY_BORDER[rarity] ?? '#1e293b',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <Text style={{ fontSize: 32 }}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' }}>
                          {item.name}
                        </Text>
                        {item.tag && (
                          <View
                            style={{
                              backgroundColor: '#f59e0b33',
                              paddingHorizontal: 5,
                              paddingVertical: 1,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                color: '#f59e0b',
                                fontSize: 8,
                                fontFamily: 'Inter_900Black',
                              }}
                            >
                              {item.tag}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: '#475569', fontSize: 10 }}>{item.description}</Text>
                      {item.materialId && (
                        <Text style={{ color: '#334155', fontSize: 9, marginTop: 2 }}>
                          Owned: {matOwned(item.materialId)}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleBuy(item)}
                      style={{
                        backgroundColor: justBought
                          ? '#10b981'
                          : item.premiumCost
                            ? '#1e3a8a'
                            : canAfford
                              ? RARITY_BORDER[rarity] + '33'
                              : '#0f172a',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                        minWidth: 70,
                        borderWidth: 1,
                        borderColor: justBought
                          ? '#10b981'
                          : item.premiumCost
                            ? '#3b82f6'
                            : canAfford
                              ? RARITY_BORDER[rarity]
                              : '#1e293b',
                      }}
                    >
                      {justBought ? (
                        <CheckCircle size={18} color="#10b981" />
                      ) : (
                        <>
                          <Text style={{ fontSize: 11 }}>{item.premiumCost ? '💠' : '💰'}</Text>
                          <Text
                            style={{
                              color: item.premiumCost ? '#60a5fa' : canAfford ? '#fff' : '#475569',
                              fontSize: 12,
                              fontFamily: 'Inter_900Black',
                            }}
                          >
                            {item.premiumCost ?? item.goldCost}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
