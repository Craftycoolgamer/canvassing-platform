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
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Company } from '../types';

export const SettingsScreen: React.FC = () => {
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const { user, logout } = useAuth();

  const loadUserCompany = async () => {
    if (user?.companyId) {
      try {
        const companiesResponse = await apiService.getCompanies();
        if (companiesResponse.success && companiesResponse.data) {
          const company = companiesResponse.data.find(c => c.id === user.companyId);
          setUserCompany(company || null);
        }
      } catch (error) {
        console.error('Error loading user company:', error);
      }
    }
  };

  useEffect(() => {
    loadUserCompany();
  }, [user?.companyId]);

  const handleCompanyChange = () => {
    // This will trigger a refresh of data in other screens when they come into focus
    console.log('Company selection changed, other screens will refresh on focus');
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        
        <TouchableOpacity style={styles.section} onPress={() => setShowLogout(!showLogout)}>
          {/* User Information */}
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
        

        {/* Companies Section - Only show if user doesn't have a company assigned */}
        {!user?.companyId && (
          <TouchableOpacity  onPress={() => setShowCompanySelector(!showCompanySelector)}>
            {showCompanySelector ? (
              <View style={styles.companySection}>
                <CompanySelector onCompanyChange={handleCompanyChange} />
              </View>
            ) : (
              <Text style={styles.companyText}>Company Menu</Text>
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
    marginBottom: 16,
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