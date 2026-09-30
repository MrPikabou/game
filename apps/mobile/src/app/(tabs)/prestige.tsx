import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/utils/gameStore';
import { TrendingUp, Lock, Shield, Zap, Target, Star } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function Prestige() {
  const insets = useSafeAreaInsets();
  const { prestigeLevel, prestigePoints, characterLevel, prestige } = useGameStore();

  const handlePrestige = () => {
    if (characterLevel < 10) {
      Alert.alert('NOT READY', 'Reach Level 10 to Prestige.');
      return;
    }

    Alert.alert('PRESTIGE', 'Reset Level and Gold to gain permanent bonuses?', [
      { text: 'CANCEL', style: 'cancel' },
      { text: 'PRESTIGE', onPress: () => prestige() },
    ]);
  };

  const bonuses = [
    {
      icon: Shield,
      name: 'Base Health',
      value: `+${prestigeLevel * 5}%`,
      desc: 'Permanent health boost',
    },
    {
      icon: Target,
      name: 'Base Damage',
      value: `+${prestigeLevel * 10}%`,
      desc: 'Permanent damage output boost',
    },
    {
      icon: Zap,
      name: 'Module Efficiency',
      value: `+${prestigeLevel * 2}%`,
      desc: 'Increases all module effects',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 25 }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <MotiView
            from={{ rotate: '0deg', scale: 0.8 }}
            animate={{ rotate: '360deg', scale: 1 }}
            transition={{ type: 'timing', duration: 4000, loop: true }}
          >
            <TrendingUp size={80} color="#a855f7" />
          </MotiView>
          <Text
            style={{ color: '#fff', fontSize: 32, fontFamily: 'Inter_900Black', marginTop: 20 }}
          >
            PRESTIGE
          </Text>
          <Text style={{ color: '#666', fontSize: 16, fontFamily: 'Inter_700Bold' }}>
            TIER {prestigeLevel}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: '#111',
            borderRadius: 20,
            padding: 20,
            marginBottom: 30,
            borderWidth: 1,
            borderColor: '#222',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <View>
              <Text style={{ color: '#666', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
                PRESTIGE POINTS
              </Text>
              <Text style={{ color: '#a855f7', fontSize: 28, fontFamily: 'Inter_900Black' }}>
                {prestigePoints.toLocaleString()}
              </Text>
            </View>
            <Star size={32} color="#a855f7" fill="#a855f7" />
          </View>

          <Text
            style={{ color: '#666', fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 15 }}
          >
            PERMANENT BONUSES
          </Text>
          {bonuses.map((bonus, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                marginBottom: 15,
                backgroundColor: '#050505',
                padding: 12,
                borderRadius: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#111',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <bonus.icon size={20} color="#a855f7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' }}>
                  {bonus.name}
                </Text>
                <Text style={{ color: '#666', fontSize: 10 }}>{bonus.desc}</Text>
              </View>
              <Text style={{ color: '#a855f7', fontSize: 16, fontFamily: 'Inter_900Black' }}>
                {bonus.value}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handlePrestige}
          style={{
            backgroundColor: characterLevel >= 10 ? '#a855f7' : '#222',
            height: 70,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#a855f7',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Inter_900Black' }}>
            {characterLevel >= 10 ? 'ASCEND NOW' : `LV. ${characterLevel} / 10`}
          </Text>
          <Text style={{ color: '#fff', fontSize: 10, opacity: 0.7 }}>
            RESET PROGRESS FOR POWER
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 40 }}>
          <Text
            style={{ color: '#666', fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 15 }}
          >
            UNLOCKED CONTENT
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {['Void Zone', 'Hyper Rounds', 'Core Stabilizer'].map((item, i) => (
              <View
                key={i}
                style={{
                  paddingHorizontal: 15,
                  paddingVertical: 8,
                  backgroundColor: prestigeLevel > i ? '#a855f722' : '#111',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: prestigeLevel > i ? '#a855f7' : '#222',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {prestigeLevel <= i && <Lock size={12} color="#666" />}
                <Text
                  style={{
                    color: prestigeLevel > i ? '#a855f7' : '#666',
                    fontSize: 12,
                    fontFamily: 'Inter_700Bold',
                  }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
