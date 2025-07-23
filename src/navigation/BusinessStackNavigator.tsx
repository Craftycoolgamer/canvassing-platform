import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { BusinessListScreen } from '../screens/BusinessListScreen';
import { LocationUpdateScreen } from '../screens/LocationUpdateScreen';

const Stack = createStackNavigator();

export const BusinessStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="BusinessList" component={BusinessListScreen} />
      <Stack.Screen name="LocationUpdate" component={LocationUpdateScreen} />
    </Stack.Navigator>
  );
}; 