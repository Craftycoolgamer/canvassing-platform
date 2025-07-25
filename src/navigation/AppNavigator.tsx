import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { BusinessStackNavigator } from './BusinessStackNavigator';
import { MapScreen } from '../screens/MapScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { PendingApprovalsScreen } from '../screens/PendingApprovalsScreen';
import { useAuth } from '../contexts/AuthContext';
import { useDataManager } from '../hooks/useDataManager';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  const { user } = useAuth();
  const { selectedCompany } = useDataManager();
  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  // Use selected company color for tab bar tint, fallback to default blue
  const tabBarTintColor = selectedCompany?.color || '#007AFF';

  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          if (route.name === 'Business List') {
            iconName = 'list';
          } else if (route.name === 'Map') {
            iconName = 'map';
          } else if (route.name === 'Analytics') {
            iconName = 'analytics';
          } else if (route.name === 'Pending Approvals') {
            iconName = 'people';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: tabBarTintColor,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Business List" component={BusinessStackNavigator} />
      <Tab.Screen name="Map" component={MapScreen} />
      {isManagerOrAdmin && (
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      )}
      {isManagerOrAdmin && (
        <Tab.Screen name="Pending Approvals" component={PendingApprovalsScreen} />
      )}
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}; 