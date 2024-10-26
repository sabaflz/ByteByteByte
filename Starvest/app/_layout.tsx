import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#ffd33d',
                headerStyle: { backgroundColor: '#376443' },
                headerShadowVisible: false,
                headerTintColor: '#fff',
                tabBarStyle: { backgroundColor: '#376443' },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons 
                            name={focused ? 'home-sharp' : 'home-outline'} 
                            color={color} 
                            size={24} 
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'Account',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons 
                            name={focused ? 'information-circle' : 'information-circle-outline'} 
                            color={color} 
                            size={24} 
                        />
                    ),
                }}
            />
        </Tabs>
    );
}