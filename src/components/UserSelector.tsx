import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { User, UserFormData, Company } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useDataManager } from '../hooks/useDataManager';

interface UserSelectorProps {
  onUserSelect?: (user: User) => void;
  onUserChange?: () => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  onUserSelect,
  onUserChange,
}) => {
  const { user: currentUser } = useAuth();
  
  // Use the centralized data manager
  const {
    users,
    companies,
    selectedUser,
    setSelectedUser,
    createUser,
    updateUser,
    deleteUser,
    syncAllData,
  } = useDataManager();

  // Local state for UI
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'User',
    companyId: '',
    isActive: true,
    canManagePins: false,
  });

  // Filter to show only regular users (not managers or admins)
  const regularUsers = users.filter(user => user.role === 'User');

  useEffect(() => {
    syncAllData();
  }, []);

  const handleUserSelect = async (user: User) => {
    try {
      await setSelectedUser(user);
      setSelectedUser(user);
      onUserSelect?.(user);
      onUserChange?.();
    } catch (error) {
      console.error('Error selecting user:', error);
      Alert.alert('Error', 'Failed to select user');
    }
  };

  const handleClearSelection = async () => {
    try {
      await setSelectedUser(null);
      onUserChange?.();
    } catch (error) {
      console.error('Error clearing user selection:', error);
      Alert.alert('Error', 'Failed to clear selection');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      role: user.role,
      companyId: user.companyId,
      isActive: user.isActive,
      canManagePins: user.canManagePins,
    });
    setShowFormModal(true);
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${user.firstName} ${user.lastName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.id);
              if (selectedUser?.id === user.id) {
                await handleClearSelection();
              }
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim() || !formData.username.trim() || 
        !formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (!editingUser && !formData.password) {
      Alert.alert('Error', 'Password is required for new users');
      return false;
    }

    if (formData.password && formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingUser) {
        // Update existing user
        const updateData = { ...formData };
        if (!formData.password) {
          delete updateData.password;
        }
        await updateUser(editingUser.id, updateData);
      } else {
        // Create new user
        await createUser(formData);
      }

      setShowFormModal(false);
      setEditingUser(null);
      setFormData({
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'User',
        companyId: '',
        isActive: true,
        canManagePins: false,
      });
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Error', 'Failed to save user');
    }
  };

  const updateField = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanySelect = (company: Company) => {
    updateField('companyId', company.id);
    setShowCompanyPicker(false);
  };

  const getAvailableRoles = () => {
    if (currentUser?.role === 'Admin') {
      return ['User', 'Manager'];
    }
    return ['User'];
  };

  const getTitle = () => {
    return 'User Management';
  };

  if (regularUsers.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="person" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Users Yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your first user to get started
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{getTitle()}</Text>
        <TouchableOpacity
          style={styles.addUserButton}
          onPress={() => {
            setEditingUser(null);
            setFormData({ 
              email: '', 
              username: '', 
              firstName: '', 
              lastName: '', 
              password: '', 
              role: 'User', 
              companyId: '', 
              isActive: true,
              canManagePins: false,
            });
            setShowFormModal(true);
          }}
        >
          <MaterialIcons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.usersList} showsVerticalScrollIndicator={false}>
        {regularUsers.map((user) => (
          <View key={user.id} style={[
            styles.userItem,
            selectedUser?.id === user.id && styles.selectedUserItem
          ]}>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={() => handleUserSelect(user)}
            >
              <View style={[styles.userIcon, { backgroundColor: getRoleColor(user.role) }]}>
                <MaterialIcons name="person" size={20} color="white" />
              </View>
              <View style={styles.userDetails}>
                <Text style={[
                  styles.userName,
                  selectedUser?.id === user.id && styles.selectedUserName
                ]}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user.companyId && currentUser?.role === 'Admin' && (
                  <Text style={styles.userRole}>
                    Company: {companies.find(c => c.id === user.companyId)?.name || user.companyId}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            
            <View style={styles.userActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditUser(user)}
              >
                <MaterialIcons name="edit" size={20} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteUser(user)}
              >
                <MaterialIcons name="delete" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {selectedUser && (
        <TouchableOpacity
          style={styles.clearSelectionButton}
          onPress={handleClearSelection}
        >
          <MaterialIcons name="clear" size={20} color="#FF3B30" />
          <Text style={styles.clearSelectionText}>Clear Selection</Text>
        </TouchableOpacity>
      )}

      {/* User Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowFormModal(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formField}>
              <Text style={styles.label}>First Name *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(value) => updateField('firstName', value)}
                  placeholder="Enter first name"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Last Name *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(value) => updateField('lastName', value)}
                  placeholder="Enter last name"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Email *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Username *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="account-circle" size={20} color="#666" style={styles.inputIcon} /> 
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(value) => updateField('username', value)}
                  placeholder="Enter username"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {!editingUser && (
              <View style={styles.formField}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={(value) => updateField('password', value)}
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.formField}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleGrid}>
                {getAvailableRoles().map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      formData.role === role && styles.selectedRole,
                    ]}
                    onPress={() => updateField('role', role as 'Admin' | 'Manager' | 'User')}
                  >
                    <Text style={[
                      styles.roleText,
                      formData.role === role && styles.selectedRoleText
                    ]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {currentUser?.role === 'Admin' && <View style={styles.formField}>
              <Text style={styles.label}>Company</Text>
              <TouchableOpacity
                style={styles.companyPicker}
                onPress={() => setShowCompanyPicker(true)}
              >
                <Text style={styles.companyPickerText}>
                  {formData.companyId ? 
                    companies.find(c => c.id === formData.companyId)?.name || 'Unknown Company' : 
                    'Select Company'
                  }
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            }

            <View style={styles.formField}>
              <View style={styles.switchContainer}>
                <Text style={styles.label}>Can Manage Pins</Text>
                <TouchableOpacity
                  style={[
                    styles.switch,
                    formData.canManagePins && styles.switchActive
                  ]}
                  onPress={() => updateField('canManagePins', !formData.canManagePins)}
                >
                  <View style={[
                    styles.switchThumb,
                    formData.canManagePins && styles.switchThumbActive
                  ]} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowFormModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmit}
            >
              <Text style={styles.saveButtonText}>{editingUser ? 'Update' : 'Create'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Company Picker Modal */}
      <Modal
        visible={showCompanyPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCompanyPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Company</Text>
            <TouchableOpacity
              onPress={() => setShowCompanyPicker(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.companyOption}
              onPress={() => {
                updateField('companyId', '');
                setShowCompanyPicker(false);
              }}
            >
              <Text style={styles.companyOptionText}>No Company</Text>
            </TouchableOpacity>
            
            {companies.map((company) => (
              <TouchableOpacity
                key={company.id}
                style={[
                  styles.companyOption,
                  formData.companyId === company.id && styles.selectedCompanyOption
                ]}
                onPress={() => handleCompanySelect(company)}
              >
                <View style={[styles.companyIcon, { backgroundColor: company.color }]}>
                  <MaterialIcons name={company.pinIcon as any} size={20} color="white" />
                </View>
                <Text style={[
                  styles.companyOptionText,
                  formData.companyId === company.id && styles.selectedCompanyOptionText
                ]}>
                  {company.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const getRoleColor = (role: string): string => {
  switch (role) {
    case 'Admin':
      return '#FF3B30';
    case 'Manager':
      return '#FF9500';
    case 'User':
      return '#007AFF';
    default:
      return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  usersList: {
    gap: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedUserItem: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#e0f2fe',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    paddingLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addUserButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  selectedUserName: {
    fontWeight: '600',
    color: '#007AFF',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  userCompany: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearSelectionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formField: {
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1a1a1a',
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedRole: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedRoleText: {
    color: 'white',
    fontWeight: '600',
  },
  companyPicker: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  companyPickerText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  companyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  selectedCompanyOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  companyOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  selectedCompanyOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  companyIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    marginTop: 8,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    position: 'absolute',
    left: 2,
  },
  switchThumbActive: {
    backgroundColor: 'white',
    transform: [{ translateX: 20 }],
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  passwordToggle: {
    padding: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
}); 