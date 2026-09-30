import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/utils/gameStore';
import { useRouter } from 'expo-router';
import { Play, Coins, Award, User } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function Lobby() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { gold, characterLevel, characterXp, prestigeLevel, startRun } = useGameStore();

  const xpProgress = (characterXp / (characterLevel * 1000)) * 100;

  const handleStartRun = () => {
    startRun();
    router.push('/play' as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
      {/* Top Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 15,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={{ color: '#666', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
            COMMANDER
          </Text>
          <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Inter_900Black' }}>
            LV. {characterLevel}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 15 }}>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Coins size={14} color="#fbbf24" />
              <Text style={{ color: '#fbbf24', fontFamily: 'Inter_700Bold' }}>
                {gold.toLocaleString()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Award size={14} color="#a855f7" />
              <Text style={{ color: '#a855f7', fontFamily: 'Inter_700Bold' }}>
                P-LV. {prestigeLevel}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* XP Bar */}
      <View style={{ height: 4, backgroundColor: '#111', width: '100%' }}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${xpProgress}%` }}
          transition={{ type: 'timing', duration: 1000 }}
          style={{ height: '100%', backgroundColor: '#3b82f6' }}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Tutorial Card */}
        <View
          style={{
            backgroundColor: '#1d4ed822',
            padding: 15,
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#1d4ed8',
          }}
        >
          <Text
            style={{ color: '#3b82f6', fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 5 }}
          >
            COMMANDER'S BRIEFING
          </Text>
          <Text style={{ color: '#aaa', fontSize: 12 }}>
            Swipe to move. Defend the base from incoming waves. Level up during combat to pick
            temporary augments. Equip Modules in the Lab to boost your base power.
          </Text>
        </View>

        {/* Character Card / Preview */}
        <View
          style={{
            height: 350,
            backgroundColor: '#111',
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 20,
            justifyContent: 'flex-end',
            padding: 20,
            borderWidth: 1,
            borderColor: '#222',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#111',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={120} color="#222" />
          </View>
          <View>
            <Text style={{ color: '#3b82f6', fontSize: 14, fontFamily: 'Inter_700Bold' }}>
              BATTLE SUIT: MK-I
            </Text>
            <Text style={{ color: '#fff', fontSize: 32, fontFamily: 'Inter_900Black' }}>
              STORM CAGE
            </Text>
          </View>
        </View>

        {/* Start Run Button */}
        <TouchableOpacity
          onPress={handleStartRun}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#3b82f6',
            height: 80,
            borderRadius: 15,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 15,
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
          }}
        >
          <Play size={28} color="#fff" fill="#fff" />
          <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Inter_900Black' }}>
            START SORTIE
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 30 }}>
          <Text
            style={{ color: '#666', fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 10 }}
          >
            CURRENT MISSIONS
          </Text>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                backgroundColor: '#111',
                padding: 15,
                borderRadius: 12,
                marginBottom: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#222',
              }}
            >
              <View>
                <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' }}>
                  Eliminate {i * 100} Enemies
                </Text>
                <Text style={{ color: '#666', fontSize: 12 }}>Reward: {i * 500} Gold</Text>
              </View>
              <View
                style={{
                  backgroundColor: '#222',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: '#aaa', fontSize: 10, fontFamily: 'Inter_700Bold' }}>0%</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
