import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { BusinessStackNavigator } from '../navigation/BusinessStackNavigator';
import { MapScreen } from '../screens/MapScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { PendingApprovalsScreen } from '../screens/PendingApprovalsScreen';
import { useNavigation as useNavigationContext } from '../contexts/NavigationContext';
import { NavigationSidebar } from './NavigationSidebar';
import { useDataManager } from '../hooks/useDataManager';



// Custom persistent tab bar component
const CustomTabBar: React.FC<any> = ({ state, navigation, visibleItems, tabBarTintColor, toggleSidebar, getIconName }) => {
  const handleNavigation = React.useCallback((screenName: string) => {
    navigation.navigate(screenName);
  }, [navigation]);

  const handleSidebarToggle = React.useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  // Add null checks for state
  const routes = state?.routes || [];
  const currentIndex = state?.index || 0;

  return (
    <View style={styles.customTabBar}>
      {/* Hamburger Menu Button */}
      <TouchableOpacity
        onPress={handleSidebarToggle}
        style={styles.tabBarItem}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons name="menu" size={24} color="#666" />
        <Text style={[styles.tabBarLabel, { color: "#666" }]}>Menu</Text>
      </TouchableOpacity>
      
      {/* Visible navigation items */}
      {visibleItems.map((item: any) => {
        const route = routes.find((r: any) => r.name === item.name);
        const isFocused = route && currentIndex === routes.indexOf(route);
        const iconColor = isFocused ? tabBarTintColor : "#666";
        const textColor = isFocused ? tabBarTintColor : "#666";
        
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleNavigation(item.name)}
            style={styles.tabBarItem}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons 
              name={getIconName(item.id)} 
              size={24} 
              color={iconColor} 
            />
            <Text style={[styles.tabBarLabel, { color: textColor }]}>{item.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};



const Tab = createBottomTabNavigator();

export const CustomTabNavigator: React.FC = () => {
  const { getVisibleItems, isSidebarOpen, toggleSidebar, navigationItems } = useNavigationContext();
  const { selectedCompany } = useDataManager();
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Use selected company color for tab bar tint, fallback to default blue
  const tabBarTintColor = selectedCompany?.color || '#007AFF';

  // Memoize visible items to prevent unnecessary re-renders
  const visibleItems = React.useMemo(() => getVisibleItems(), [getVisibleItems]);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isSidebarOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isSidebarOpen, animatedValue]);

  const getScreenComponent = React.useCallback((itemId: string) => {
    switch (itemId) {
      case 'businessList':
        return BusinessStackNavigator;
      case 'map':
        return MapScreen;
      case 'analytics':
        return AnalyticsScreen;
      case 'pendingApprovals':
        return PendingApprovalsScreen;
      case 'settings':
        return SettingsScreen;
      default:
        return MapScreen;
    }
  }, []);

  const getIconName = React.useCallback((itemId: string): keyof typeof MaterialIcons.glyphMap => {
    switch (itemId) {
      case 'businessList':
        return 'list';
      case 'map':
        return 'map';
      case 'analytics':
        return 'analytics';
      case 'pendingApprovals':
        return 'people';
      case 'settings':
        return 'settings';
      default:
        return 'help';
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Tab Navigator with custom tab bar */}
      <Tab.Navigator 
        screenOptions={{ 
          headerShown: false,
        }}
        tabBar={(props) => <CustomTabBar {...props} visibleItems={visibleItems} tabBarTintColor={tabBarTintColor} toggleSidebar={toggleSidebar} getIconName={getIconName} />}
      >
        {/* Register all navigation items as tab screens */}
        {navigationItems.map((item: any) => (
          <Tab.Screen
            key={item.id}
            name={item.name}
            component={getScreenComponent(item.id)}
          />
        ))}
      </Tab.Navigator>

      {/* Navigation sidebar overlay */}
      <NavigationSidebar animatedValue={animatedValue} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customTabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    minHeight: 60,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
}); 