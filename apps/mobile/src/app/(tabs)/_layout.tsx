import { Tabs } from 'expo-router';
import { Home, Zap, Target, TrendingUp } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopWidth: 1,
          borderTopColor: '#222',
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter_700Bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'COMMAND',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          title: 'MODULES',
          tabBarIcon: ({ color }) => <Zap size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="turrets"
        options={{
          title: 'TURRETS',
          tabBarIcon: ({ color }) => <Target size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prestige"
        options={{
          title: 'PRESTIGE',
          tabBarIcon: ({ color }) => <TrendingUp size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
