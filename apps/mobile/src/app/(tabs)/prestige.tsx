import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/utils/gameStore';
import { TrendingUp, Shield, Zap, Target, Star, Lock } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function Prestige() {
  const insets = useSafeAreaInsets();
  const {
    prestigeLevel,
    prestigePoints,
    characterLevel,
    prestige,
    gold,
    ownedModules,
    turretBuilds,
  } = useGameStore();

  const handlePrestige = () => {
    if (characterLevel < 10) {
      Alert.alert('NOT READY', 'Reach Commander Level 10 to Prestige.');
      return;
    }
    Alert.alert(
      'PRESTIGE',
      'Reset your Commander Level to 1. You KEEP all modules, gold, turrets, and materials. You gain a permanent stat boost.',
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'ASCEND', style: 'destructive', onPress: () => prestige() },
      ]
    );
  };

  const statBoosts = [
    {
      icon: Shield,
      name: 'Base Health',
      value: `+${(prestigeLevel + 1) * 5}%`,
      desc: 'Applied each run on next prestige',
      color: '#ef4444',
    },
    {
      icon: Target,
      name: 'Base Damage',
      value: `+${(prestigeLevel + 1) * 10}%`,
      desc: 'Increases all damage dealt',
      color: '#f97316',
    },
    {
      icon: Zap,
      name: 'Module Power',
      value: `+${(prestigeLevel + 1) * 2}%`,
      desc: 'Boosts all module stat effects',
      color: '#a855f7',
    },
  ];

  const currentBoosts =
    prestigeLevel > 0
      ? [
          { icon: Shield, name: 'Base Health', value: `+${prestigeLevel * 5}%`, color: '#ef4444' },
          { icon: Target, name: 'Base Damage', value: `+${prestigeLevel * 10}%`, color: '#f97316' },
          { icon: Zap, name: 'Module Power', value: `+${prestigeLevel * 2}%`, color: '#a855f7' },
        ]
      : null;

  const modulesOwned = ownedModules.length;
  const turretsLevelled = Object.values(turretBuilds).filter((b) => b.level > 1).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ padding: 22, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <MotiView
            from={{ scale: 0.9 }}
            animate={{ scale: 1.0 }}
            transition={{ type: 'spring', loop: true, repeatReverse: true }}
          >
            <TrendingUp size={72} color="#a855f7" />
          </MotiView>
          <Text
            style={{ color: '#fff', fontSize: 30, fontFamily: 'Inter_900Black', marginTop: 16 }}
          >
            PRESTIGE
          </Text>
          <Text style={{ color: '#a855f7', fontSize: 14, fontFamily: 'Inter_700Bold' }}>
            TIER {prestigeLevel} {prestigeLevel > 0 ? '⭐'.repeat(Math.min(prestigeLevel, 5)) : ''}
          </Text>
        </View>

        {/* Stats kept card */}
        <View
          style={{
            backgroundColor: '#0a111e',
            borderRadius: 16,
            padding: 18,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#1e293b',
          }}
        >
          <Text
            style={{
              color: '#475569',
              fontSize: 11,
              fontFamily: 'Inter_700Bold',
              marginBottom: 14,
            }}
          >
            ✅ WHAT YOU KEEP ON PRESTIGE
          </Text>
          {[
            { label: `${modulesOwned} modules owned`, icon: '🔮' },
            { label: `${gold.toLocaleString()} gold`, icon: '💰' },
            { label: `${turretsLevelled} turrets levelled`, icon: '⚙️' },
            { label: 'All materials & progress', icon: '🧪' },
            { label: 'All prestige points', icon: '⭐' },
          ].map((item, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 7,
                borderBottomWidth: i < 4 ? 1 : 0,
                borderBottomColor: '#0f172a',
              }}
            >
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13, fontFamily: 'Inter_700Bold' }}>
                {item.label}
              </Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10 }}>
            <Text style={{ fontSize: 16 }}>⬇️</Text>
            <Text style={{ color: '#ef4444', fontSize: 13, fontFamily: 'Inter_700Bold' }}>
              Character Level resets to 1
            </Text>
          </View>
        </View>

        {/* Prestige points */}
        <View
          style={{
            backgroundColor: '#0a111e',
            borderRadius: 16,
            padding: 18,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#2d1b69',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
              PRESTIGE POINTS
            </Text>
            <Star size={20} color="#a855f7" fill="#a855f7" />
          </View>
          <Text
            style={{
              color: '#a855f7',
              fontSize: 36,
              fontFamily: 'Inter_900Black',
              marginBottom: 4,
            }}
          >
            {prestigePoints}
          </Text>
          <Text style={{ color: '#334155', fontSize: 11 }}>+50 points on next prestige</Text>
        </View>

        {/* Current boosts */}
        {currentBoosts && (
          <View
            style={{
              backgroundColor: '#0a111e',
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#1e293b',
            }}
          >
            <Text
              style={{
                color: '#475569',
                fontSize: 11,
                fontFamily: 'Inter_700Bold',
                marginBottom: 12,
              }}
            >
              CURRENT BOOSTS (TIER {prestigeLevel})
            </Text>
            {currentBoosts.map((b, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 8,
                  borderBottomWidth: i < 2 ? 1 : 0,
                  borderBottomColor: '#0f172a',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: b.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <b.icon size={18} color={b.color} />
                </View>
                <Text
                  style={{ flex: 1, color: '#94a3b8', fontSize: 13, fontFamily: 'Inter_700Bold' }}
                >
                  {b.name}
                </Text>
                <Text style={{ color: b.color, fontSize: 16, fontFamily: 'Inter_900Black' }}>
                  {b.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Next prestige boosts */}
        <View
          style={{
            backgroundColor: '#0a111e',
            borderRadius: 16,
            padding: 18,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#a855f733',
          }}
        >
          <Text
            style={{
              color: '#a855f7',
              fontSize: 11,
              fontFamily: 'Inter_700Bold',
              marginBottom: 12,
            }}
          >
            ON NEXT PRESTIGE (TIER {prestigeLevel + 1})
          </Text>
          {statBoosts.map((b, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 8,
                borderBottomWidth: i < 2 ? 1 : 0,
                borderBottomColor: '#0f172a',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: b.color + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <b.icon size={18} color={b.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' }}>
                  {b.name}
                </Text>
                <Text style={{ color: '#334155', fontSize: 10 }}>{b.desc}</Text>
              </View>
              <Text style={{ color: b.color, fontSize: 16, fontFamily: 'Inter_900Black' }}>
                {b.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Prestige button */}
        <TouchableOpacity
          onPress={handlePrestige}
          style={{
            backgroundColor: characterLevel >= 10 ? '#a855f7' : '#111',
            height: 68,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: characterLevel >= 10 ? 0 : 1,
            borderColor: '#334155',
          }}
        >
          {characterLevel >= 10 ? (
            <>
              <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Inter_900Black' }}>
                ⭐ ASCEND NOW
              </Text>
              <Text style={{ color: '#e9d5ff', fontSize: 10, marginTop: 2 }}>
                Level resets · Everything else kept
              </Text>
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Lock size={16} color="#475569" />
                <Text style={{ color: '#475569', fontSize: 16, fontFamily: 'Inter_900Black' }}>
                  LV. {characterLevel} / 10 TO PRESTIGE
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
