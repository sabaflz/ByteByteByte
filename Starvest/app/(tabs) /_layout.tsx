import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';


export default function TabLayout() {
    return (
        <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#t', // color of the icons at the bottom
          headerStyle: {
            backgroundColor: '#376443', // the header color
          },
          headerShadowVisible: false,
          headerTintColor: '#fff',
          tabBarStyle: {
          backgroundColor: '#fff',
          paddingBottom: 10,
          },
        }}
        >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="reminders"
          options={{
            title: 'Reminders',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'notifications' : 'notifications-outline'} color={color} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={28}/>
            ),
          }}
        />
      </Tabs>
    );
  }
