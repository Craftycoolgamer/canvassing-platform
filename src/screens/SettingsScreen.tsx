import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CompanySelector } from '../components/CompanySelector';
import { UserSelector } from '../components/UserSelector';
import { ManagerSelector } from '../components/ManagerSelector';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { Company } from '../types';
import { useDataManager } from '../hooks/useDataManager';

export const SettingsScreen: React.FC = () => {
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [showManagerSelector, setShowManagerSelector] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const { user, logout } = useAuth();

  // Use the centralized data manager
  const {
    companies,
    syncAllData,
  } = useDataManager();

  // Get user's company from the centralized data
  const userCompany = user?.companyId ? companies.find(c => c.id === user.companyId) || null : null;

  useEffect(() => {
    syncAllData();
  }, []);

  const handleCompanyChange = () => {
    console.log('Company selection changed, other screens will refresh on focus');
  };

  const handleUserChange = () => {
    console.log('User selection changed');
  };

  const handleManagerChange = () => {
    console.log('Manager selection changed');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const canManageUsers = isAdmin || isManager;
  const canManageManagers = isAdmin;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Information Section */}
        <TouchableOpacity style={styles.section} onPress={() => setShowLogout(!showLogout)}>
          {user && (
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <MaterialIcons name="person" size={24} color="white" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userRole}>Role: {user.role}</Text>
                {user.role !== 'Admin' && (
                  <Text style={styles.userEmail}>
                    Company: {userCompany ? userCompany.name : user.companyId }
                  </Text>
                )}
              </View>
            </View>
          )}

          {showLogout && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color="#FF3B30" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Companies Section - Only show for Admin */}
        {isAdmin && (
          <TouchableOpacity onPress={() => setShowCompanySelector(!showCompanySelector)}>
            {showCompanySelector ? (
              <View style={styles.companySection}>
                <CompanySelector onCompanyChange={handleCompanyChange} />
              </View>
            ) : (
              <Text style={styles.companyText}>Company Menu</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Manager Section - Only for Admin */}
        {canManageManagers && (
          <TouchableOpacity onPress={() => setShowManagerSelector(!showManagerSelector)}>
            {showManagerSelector ? (
              <View style={styles.managerSection}>
                <ManagerSelector onManagerChange={handleManagerChange} />
              </View>
            ) : (
              <Text style={styles.managerText}>Manager Menu</Text>
            )}
          </TouchableOpacity>
        )}

        {/* User Section - Only for Admin and Manager */}
        {canManageUsers && (
          <TouchableOpacity onPress={() => setShowUserSelector(!showUserSelector)}>
            {showUserSelector ? (
              <View style={styles.userSection}>
                <UserSelector onUserChange={handleUserChange} />
              </View>
            ) : (
              <Text style={styles.userText}>User Menu</Text>
            )}
          </TouchableOpacity>
        )}

        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: '#f8f9fa',
  },
  header: {
    height: 60,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  companySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  companyText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
  },
  userSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  userText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
  },
  managerSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginTop: 12,
  },
  managerText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    marginTop: 10,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
}); 