import React from 'react';
import { Provider } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import EventsScreen from '../screens/EventsScreen';
import CameraScreen from '../screens/CameraScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Platform } from 'react-native';

const Tab = createBottomTabNavigator();

const TabNavigator = ()=> {
  return (
    <Provider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Events') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else if (route.name === 'Memories') {
              iconName = focused ? 'images' : 'images-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'indigo',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { backgroundColor: '#131324', borderTopWidth: 0 }, 
          headerShown: false,
        })}
      >
        <Tab.Screen name="Events" component={EventsScreen} />
        <Tab.Screen name="Memories" component={CameraScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </Provider>
  );
}

export default TabNavigator;
