import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation as useNavigationContext } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.8;

interface NavigationSidebarProps {
  animatedValue: Animated.Value;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ animatedValue }) => {
  const {
    isSidebarOpen,
    navigationItems,
    closeSidebar,
    toggleItemVisibility,
    reorderItems,
    getVisibleItems,
  } = useNavigationContext();
  const { user } = useAuth();
  const navigation = useNavigation();
  const visibleItems = getVisibleItems();

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIDEBAR_WIDTH, 0],
  });

  const overlayOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const handleItemPress = (itemId: string) => {
    // Navigate to the item
    const item = navigationItems.find(navItem => navItem.id === itemId);
    if (item) {
      navigation.navigate(item.name as never);
      closeSidebar();
    }
  };

  const canAccessItem = (item: any) => {
    if (!item.requiresRole) return true;
    if (item.requiresRole === 'Admin' && user?.role === 'Admin') return true;
    if (item.requiresRole === 'Manager' && (user?.role === 'Admin' || user?.role === 'Manager')) return true;
    return false;
  };

  const accessibleItems = navigationItems.filter(canAccessItem);

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
        pointerEvents={isSidebarOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={closeSidebar}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Navigation</Text>
          <TouchableOpacity onPress={closeSidebar} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>

          {accessibleItems.map((item, index) => (
            <View key={item.id} style={styles.itemContainer}>
              <TouchableOpacity 
                style={styles.itemContent}
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={24}
                    color={item.isVisible ? '#007AFF' : '#999'}
                  />
                  <Text
                    style={[
                      styles.itemText,
                      { color: item.isVisible ? '#333' : '#999' },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {/* <MaterialIcons
                    name="chevron-right"
                    size={16}
                    color={item.isVisible ? '#007AFF' : '#ccc'}
                    style={{ marginLeft: 8 }}
                  /> */}
                </View>

                <View style={styles.itemRight}>
                  <Switch
                    value={item.isVisible}
                    onValueChange={() => toggleItemVisibility(item.id)}
                    trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                    thumbColor={item.isVisible ? '#fff' : '#f4f3f4'}
                  />
                  
                  {/* Reorder buttons on the right */}
                  <View style={styles.reorderButtonsRight}>
                    <TouchableOpacity
                      style={[styles.reorderButtonRight, index === 0 && styles.reorderButtonDisabled]}
                      onPress={() => index > 0 && reorderItems(index, index - 1)}
                      disabled={index === 0}
                    >
                      <MaterialIcons
                        name="keyboard-arrow-up"
                        size={16}
                        color={index === 0 ? '#ccc' : '#007AFF'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.reorderButtonRight,
                        index === accessibleItems.length - 1 && styles.reorderButtonDisabled,
                      ]}
                      onPress={() =>
                        index < accessibleItems.length - 1 && reorderItems(index, index + 1)
                      }
                      disabled={index === accessibleItems.length - 1}
                    >
                      <MaterialIcons
                        name="keyboard-arrow-down"
                        size={16}
                        color={index === accessibleItems.length - 1 ? '#ccc' : '#007AFF'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 999,
  },
  overlayTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    marginTop: 30,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  itemContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  reorderButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  reorderButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtonsRight: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  reorderButtonRight: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtonDisabled: {
    opacity: 0.5,
  },
}); 