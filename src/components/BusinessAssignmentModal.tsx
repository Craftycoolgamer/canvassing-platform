import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Business, User, Company } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useDataManager } from '../hooks/useDataManager';

interface BusinessAssignmentModalProps {
  visible: boolean;
  business: Business | null;
  users: User[];
  companies: Company[];
  onClose: () => void;
  onAssignmentChange: () => void;
}

export const BusinessAssignmentModal: React.FC<BusinessAssignmentModalProps> = ({
  visible,
  business,
  users,
  companies,
  onClose,
  onAssignmentChange,
}) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Use the centralized data manager
  const {
    assignBusinessToUser,
    unassignBusinessFromUser,
  } = useDataManager();

  useEffect(() => {
    if (business) {
      setSelectedUserId(business.assignedUserId || null);
    }
  }, [business]);

  const handleAssignBusiness = async () => {
    if (!business || !selectedUserId) return;

    setLoading(true);
    try {
      await assignBusinessToUser(business.id, selectedUserId);
      Alert.alert('Success', 'Business assigned successfully');
      onAssignmentChange();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign business');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignBusiness = async () => {
    if (!business) return;

    setLoading(true);
    try {
      await unassignBusinessFromUser(business.id);
      Alert.alert('Success', 'Business unassigned successfully');
      onAssignmentChange();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to unassign business');
    } finally {
      setLoading(false);
    }
  };

  const canAssignBusinesses = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  if (!business) return null;

  // Get the company for this business
  const businessCompany = companies.find(company => company.id === business.companyId);

  // Filter users based on current user's permissions and company
  const availableUsers = users.filter(user => {
    // First check if user is in the same company as the business
    if (user.companyId !== business.companyId) {
      return false;
    }

    // Then check if the user is a manager or admin
    if (user.role === 'Manager' || user.role === 'Admin') {
      return false;
    }

    // Only show active users
    if (!user.isActive) {
      return false;
    }

    return true;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Assign Business</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{business.name}</Text>
              <Text style={styles.businessAddress}>{business.address}</Text>
              {businessCompany && (
                <View style={styles.companyInfo}>
                  <View style={[styles.companyIcon, { backgroundColor: businessCompany.color }]}>
                    <MaterialIcons name={businessCompany.pinIcon as any} size={16} color="white" />
                  </View>
                  <Text style={styles.companyName}>{businessCompany.name}</Text>
                </View>
              )}
            </View>

            {!canAssignBusinesses ? (
              <View style={styles.noPermission}>
                <MaterialIcons name="lock" size={48} color="#ccc" />
                <Text style={styles.noPermissionText}>
                  You don't have permission to assign businesses
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Assign to User</Text>
                
                {availableUsers.length === 0 ? (
                  <Text style={styles.noUsersText}>No users available for assignment in this company</Text>
                ) : (
                  <View style={styles.userList}>
                    {availableUsers.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.userOption,
                          selectedUserId === user.id && styles.selectedUser,
                        ]}
                        onPress={() => setSelectedUserId(user.id)}
                      >
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>
                            {user.firstName} {user.lastName}
                          </Text>
                          <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                        {selectedUserId === user.id && (
                          <MaterialIcons name="check" size={20} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.actionButtons}>
                  {business.assignedUserId ? (
                    <TouchableOpacity
                      style={[styles.button, styles.unassignButton]}
                      onPress={handleUnassignBusiness}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={styles.buttonText}>Unassign</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.button, styles.assignButton]}
                      onPress={handleAssignBusiness}
                      disabled={loading || !selectedUserId}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={styles.buttonText}>Assign</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  businessInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  companyIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  noPermission: {
    alignItems: 'center',
    padding: 40,
  },
  noPermissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  noUsersText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  userList: {
    marginBottom: 20,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  selectedUser: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  assignButton: {
    backgroundColor: '#007AFF',
  },
  unassignButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 