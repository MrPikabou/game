import { Tabs } from 'expo-router';
import { Home, User, Target, TrendingUp, BookOpen, ShoppingBag } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopWidth: 1,
          borderTopColor: '#1e293b',
          paddingBottom: 4,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 9, fontFamily: 'Inter_700Bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'COMMAND', tabBarIcon: ({ color }) => <Home size={21} color={color} /> }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          title: 'CHARACTER',
          tabBarIcon: ({ color }) => <User size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="turrets"
        options={{
          title: 'TURRETS',
          tabBarIcon: ({ color }) => <Target size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="encyclopedia"
        options={{
          title: 'BESTIARY',
          tabBarIcon: ({ color }) => <BookOpen size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'SHOP',
          tabBarIcon: ({ color }) => <ShoppingBag size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prestige"
        options={{
          title: 'PRESTIGE',
          tabBarIcon: ({ color }) => <TrendingUp size={21} color={color} />,
        }}
      />
    </Tabs>
  );
}
