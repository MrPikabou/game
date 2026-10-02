import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/utils/gameStore';
import { useRouter } from 'expo-router';
import { Play, Coins, Award, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';
import { DAILY_MISSION_DEFS } from '@/utils/dailyMissions';
import { MONTHLY_REWARDS, LOGIN_REWARD_MAP } from '@/utils/loginRewards';
import { MAP_DEFS, getMapDef } from '@/utils/gameConfig';

export default function Lobby() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    gold,
    characterLevel,
    characterXp,
    prestigeLevel,
    activeMissionIds,
    missions,
    startRun,
    claimMission,
    refreshMissionsIfNeeded,
    eliteMode,
    setEliteMode,
    currentMap,
    setMap,
    unlockedMaps,
    loginStreak,
    lastLoginDate,
    loginRewardsClaimed,
    currentMonthKey,
    checkLoginReward,
    claimLoginReward,
    stageRewards,
  } = useGameStore();

  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    refreshMissionsIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    checkLoginReward();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    if (lastLoginDate !== todayStr) {
      setTimeout(() => setShowLogin(true), 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const xpPct = Math.min(100, (characterXp / (characterLevel * 1000)) * 100);
  const mapDef = getMapDef(currentMap);
  const dayNum = new Date().getDate();
  const todayReward = LOGIN_REWARD_MAP[dayNum];
  const todayKey = `${currentMonthKey}-d${dayNum}`;
  const todayClaimed = loginRewardsClaimed[todayKey];

  // Only 3 active missions per day
  const activeMissions = activeMissionIds
    .map((id) => {
      const mp = missions.find((m) => m.missionId === id);
      const def = DAILY_MISSION_DEFS.find((d) => d.id === id);
      if (!mp || !def) return null;
      return { mp, def };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const completedCount = activeMissions.filter(
    ({ mp, def }) => mp.current >= def.target && mp.claimed
  ).length;
  const readyToClaim = activeMissions.filter(
    ({ mp, def }) => mp.current >= def.target && !mp.claimed
  ).length;

  const handleStartRun = () => {
    startRun();
    router.push('/play' as never);
  };

  const goMap = (dir: number) => {
    const next = currentMap + dir;
    if (next < 1 || next > MAP_DEFS.length) return;
    if (!unlockedMaps.includes(next)) {
      Alert.alert('MAP LOCKED', `Complete Map ${next - 1} to unlock this stage.`);
      return;
    }
    setMap(next);
  };

  const mapStageRewards = stageRewards.filter((r) => r.mapId === currentMap);

  return (
    <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={{ color: '#475569', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
            COMMANDER
          </Text>
          <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Inter_900Black' }}>
            LV. {characterLevel}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Coins size={13} color="#fbbf24" />
            <Text style={{ color: '#fbbf24', fontFamily: 'Inter_700Bold', fontSize: 13 }}>
              {gold.toLocaleString()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Award size={13} color="#a855f7" />
            <Text style={{ color: '#a855f7', fontFamily: 'Inter_700Bold', fontSize: 12 }}>
              PRESTIGE {prestigeLevel}
            </Text>
          </View>
        </View>
      </View>

      {/* XP bar */}
      <View
        style={{
          height: 4,
          backgroundColor: '#0f172a',
          marginHorizontal: 20,
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 14,
        }}
      >
        <MotiView
          from={{ width: '0%' as const }}
          animate={{ width: `${xpPct}%` as `${number}%` }}
          transition={{ type: 'timing', duration: 800 }}
          style={{ height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* MAP SELECTOR */}
        <View
          style={{
            backgroundColor: '#0a111e',
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
            borderWidth: 2,
            borderColor: mapDef.color + '55',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => goMap(-1)}
              style={{
                padding: 8,
                backgroundColor: '#0f172a',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#1e293b',
              }}
            >
              <ChevronLeft size={18} color={currentMap > 1 ? '#fff' : '#334155'} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>{mapDef.icon}</Text>
              <Text style={{ color: mapDef.color, fontSize: 16, fontFamily: 'Inter_900Black' }}>
                {mapDef.name}
              </Text>
              <Text style={{ color: '#475569', fontSize: 10 }}>{mapDef.description}</Text>
            </View>
            <TouchableOpacity
              onPress={() => goMap(1)}
              style={{
                padding: 8,
                backgroundColor: '#0f172a',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#1e293b',
              }}
            >
              <ChevronRight
                size={18}
                color={unlockedMaps.includes(currentMap + 1) ? '#fff' : '#334155'}
              />
            </TouchableOpacity>
          </View>

          {/* Map dots */}
          <View
            style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12 }}
          >
            {MAP_DEFS.map((m) => {
              const unlocked = unlockedMaps.includes(m.id);
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() =>
                    unlocked
                      ? setMap(m.id)
                      : Alert.alert('LOCKED', `Beat Map ${m.id - 1} to unlock`)
                  }
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: m.id === currentMap ? m.color : '#0f172a',
                    borderWidth: 2,
                    borderColor: m.id === currentMap ? m.color : unlocked ? '#334155' : '#1e293b',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13 }}>{unlocked ? m.icon : '🔒'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Elite toggle */}
          <TouchableOpacity
            onPress={() => setEliteMode(!eliteMode)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: eliteMode ? '#7f1d1d33' : '#0f172a',
              padding: 12,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: eliteMode ? '#ef4444' : '#1e293b',
            }}
          >
            <View>
              <Text
                style={{
                  color: eliteMode ? '#ef4444' : '#475569',
                  fontSize: 13,
                  fontFamily: 'Inter_900Black',
                }}
              >
                {eliteMode ? '⚠️  ELITE MODE ON' : '🟢 NORMAL MODE'}
              </Text>
              <Text style={{ color: '#334155', fontSize: 9 }}>
                {eliteMode ? 'Enemies ×2 HP & speed · Drops +50%' : 'Standard rules'}
              </Text>
            </View>
            <View
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                backgroundColor: eliteMode ? '#ef4444' : '#1e293b',
                alignItems: eliteMode ? 'flex-end' : 'flex-start',
                justifyContent: 'center',
                padding: 2,
              }}
            >
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* START BUTTON */}
        <TouchableOpacity
          onPress={handleStartRun}
          activeOpacity={0.85}
          style={{
            backgroundColor: eliteMode ? '#991b1b' : '#1d4ed8',
            height: 72,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            marginBottom: 18,
          }}
        >
          <Play size={24} color="#fff" fill="#fff" />
          <View>
            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Inter_900Black' }}>
              {eliteMode ? '⚠️  ELITE SORTIE' : 'START SORTIE'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, textAlign: 'center' }}>
              {mapDef.name} · Win at Run LV.20
            </Text>
          </View>
        </TouchableOpacity>

        {/* STAGE REWARDS */}
        <Text
          style={{ color: '#fff', fontSize: 13, fontFamily: 'Inter_900Black', marginBottom: 8 }}
        >
          🏆 MAP {currentMap} COMPLETION REWARDS
        </Text>
        <View
          style={{
            backgroundColor: '#0a111e',
            borderRadius: 14,
            padding: 14,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: '#1e293b',
          }}
        >
          <Text style={{ color: '#334155', fontSize: 10, marginBottom: 10 }}>
            Finish the run with HP% remaining to unlock
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {mapStageRewards.map((r) => {
              const icons: Record<string, string> = { '25': '📦', '50': '🎁', '100': '👑' };
              const labels: Record<string, string> = {
                '25': '25% HP',
                '50': '50% HP',
                '100': '100% HP',
              };
              const costs: Record<string, string> = { '25': '100g', '50': '200g', '100': '400g' };
              return (
                <TouchableOpacity
                  key={r.milestone}
                  onPress={() =>
                    !r.claimed &&
                    Alert.alert('LOCKED', 'Complete a run with enough HP to claim this reward.')
                  }
                  style={{
                    flex: 1,
                    backgroundColor: r.claimed ? '#0a1a0a' : '#0f172a',
                    borderRadius: 10,
                    padding: 10,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: r.claimed ? '#15803d' : '#1e293b',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{r.claimed ? '✅' : icons[r.milestone]}</Text>
                  <Text
                    style={{
                      color: r.claimed ? '#10b981' : '#64748b',
                      fontSize: 9,
                      fontFamily: 'Inter_700Bold',
                      marginTop: 4,
                      textAlign: 'center',
                    }}
                  >
                    {labels[r.milestone]}
                  </Text>
                  {!r.claimed && (
                    <Text style={{ color: '#334155', fontSize: 8, marginTop: 1 }}>
                      {costs[r.milestone]}+mats
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* DAILY MISSIONS (3 only) */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Inter_900Black' }}>
            DAILY MISSIONS
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {readyToClaim > 0 && (
              <View
                style={{
                  backgroundColor: '#10b98122',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#10b981',
                }}
              >
                <Text style={{ color: '#10b981', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
                  {readyToClaim} READY
                </Text>
              </View>
            )}
            <Text style={{ color: '#475569', fontSize: 10, fontFamily: 'Inter_700Bold' }}>
              {completedCount}/3
            </Text>
          </View>
        </View>

        {activeMissions.map(({ mp, def }) => {
          const done = mp.current >= def.target;
          const claimed = mp.claimed;
          return (
            <View
              key={mp.missionId}
              style={{
                backgroundColor: claimed ? '#0a1a12' : done ? '#0a1a0a' : '#0a111e',
                padding: 14,
                borderRadius: 14,
                marginBottom: 10,
                borderWidth: 2,
                borderColor: claimed ? '#1d4a2f' : done ? '#10b981' : '#1e293b',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: '#0f172a',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: done ? '#10b981' : '#1e293b',
                }}
              >
                {claimed ? (
                  <CheckCircle size={22} color="#10b981" />
                ) : (
                  <Text
                    style={{
                      color: done ? '#10b981' : '#475569',
                      fontSize: 10,
                      fontFamily: 'Inter_900Black',
                      textAlign: 'center',
                    }}
                  >
                    {mp.current}/{def.target}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: claimed ? '#475569' : '#fff',
                    fontSize: 14,
                    fontFamily: 'Inter_700Bold',
                    textDecorationLine: claimed ? 'line-through' : 'none',
                  }}
                >
                  {def.title}
                </Text>
                <Text style={{ color: '#334155', fontSize: 10 }}>{def.description}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: '#fbbf24', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
                  +{def.goldReward}g
                </Text>
                {def.materialReward && (
                  <Text style={{ color: '#a855f7', fontSize: 9 }}>
                    {def.materialReward.qty}× mat
                  </Text>
                )}
                {done && !claimed && (
                  <TouchableOpacity
                    onPress={() => claimMission(mp.missionId)}
                    style={{
                      backgroundColor: '#10b981',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter_900Black' }}>
                      CLAIM
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* LOGIN REWARD MODAL */}
      <Modal visible={showLogin} transparent animationType="fade">
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
            from={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              width: '100%',
              backgroundColor: '#0a111e',
              borderRadius: 22,
              padding: 24,
              borderWidth: 2,
              borderColor: '#fbbf24',
            }}
          >
            <Text
              style={{
                color: '#fbbf24',
                fontSize: 11,
                fontFamily: 'Inter_700Bold',
                marginBottom: 4,
              }}
            >
              🔥 DAY {loginStreak} STREAK
            </Text>
            <Text
              style={{
                color: '#fff',
                fontSize: 22,
                fontFamily: 'Inter_900Black',
                marginBottom: 16,
              }}
            >
              DAILY LOGIN REWARD
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 20 }}>
              {MONTHLY_REWARDS.slice(0, 14).map((r) => {
                const key = `${currentMonthKey}-d${r.day}`;
                const claimed = loginRewardsClaimed[key];
                const isToday = r.day === dayNum;
                return (
                  <View
                    key={r.day}
                    style={{
                      width: 36,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: claimed ? '#0a1a0a' : isToday ? '#fbbf2422' : '#0f172a',
                      borderWidth: 2,
                      borderColor: claimed ? '#10b981' : isToday ? '#fbbf24' : '#1e293b',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: claimed ? 13 : 10 }}>{claimed ? '✅' : r.icon}</Text>
                    <Text
                      style={{
                        color: isToday ? '#fbbf24' : '#334155',
                        fontSize: 7,
                        fontFamily: 'Inter_700Bold',
                      }}
                    >
                      D{r.day}
                    </Text>
                  </View>
                );
              })}
            </View>

            {todayReward && (
              <View
                style={{
                  backgroundColor: '#050d1a',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 18,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 36 }}>{todayReward.icon}</Text>
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 18,
                    fontFamily: 'Inter_900Black',
                    marginTop: 8,
                  }}
                >
                  {todayReward.label}
                </Text>
                {todayReward.isSpecial && (
                  <Text
                    style={{
                      color: '#f59e0b',
                      fontSize: 11,
                      fontFamily: 'Inter_700Bold',
                      marginTop: 4,
                    }}
                  >
                    ✨ SPECIAL REWARD
                  </Text>
                )}
              </View>
            )}

            {todayClaimed ? (
              <View
                style={{
                  backgroundColor: '#0a1a0a',
                  padding: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#10b981',
                }}
              >
                <CheckCircle size={22} color="#10b981" />
                <Text
                  style={{
                    color: '#10b981',
                    fontSize: 12,
                    fontFamily: 'Inter_700Bold',
                    marginTop: 6,
                  }}
                >
                  ALREADY CLAIMED TODAY
                </Text>
              </View>
            ) : todayReward ? (
              <TouchableOpacity
                onPress={() => {
                  claimLoginReward(todayReward);
                  setShowLogin(false);
                }}
                style={{
                  backgroundColor: '#fbbf24',
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#000', fontSize: 16, fontFamily: 'Inter_900Black' }}>
                  🎁 CLAIM REWARD
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => setShowLogin(false)}
              style={{ marginTop: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#475569', fontSize: 13 }}>Close</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
}
