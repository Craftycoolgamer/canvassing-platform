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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserFormData, Company } from '../types';
import { apiService } from '../services/api';
import { StorageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';

interface ManagerSelectorProps {
  onManagerSelect?: (user: User) => void;
  onManagerChange?: () => void;
}

export const ManagerSelector: React.FC<ManagerSelectorProps> = ({
  onManagerSelect,
  onManagerChange,
}) => {
  const [managers, setManagers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedManager, setSelectedManager] = useState<User | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [editingManager, setEditingManager] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'Manager',
    companyId: '',
    isActive: true,
    canManagePins: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadManagers();
    loadCompanies();
  }, []);

  const loadManagers = async () => {
    try {
      console.log('Loading managers from API...');
      const response = await apiService.getUsers();
      
      if (response.success && response.data) {
        const managersOnly = response.data.filter(user => user.role === 'Manager');
        setManagers(managersOnly);
        console.log('Loaded managers from API:', managersOnly.length);
        await loadSelectedManager(managersOnly);
      } else {
        console.log('API failed, loading from local storage');
        const usersData = await StorageService.getUsers();
        const managersOnly = usersData.filter(user => user.role === 'Manager');
        setManagers(managersOnly);
        await loadSelectedManager(managersOnly);
      }
    } catch (error) {
      console.error('Error loading managers:', error);
      try {
        const usersData = await StorageService.getUsers();
        const managersOnly = usersData.filter(user => user.role === 'Manager');
        setManagers(managersOnly);
        await loadSelectedManager(managersOnly);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        Alert.alert('Error', 'Failed to load managers');
      }
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await apiService.getCompanies();
      if (response.success && response.data) {
        setCompanies(response.data);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadSelectedManager = async (managersList: User[] = managers) => {
    try {
      const selectedManagerId = await AsyncStorage.getItem('selectedManagerId');
      if (selectedManagerId) {
        const manager = managersList.find(m => m.id === selectedManagerId);
        setSelectedManager(manager || null);
        console.log('Selected manager:', manager?.firstName);
      }
    } catch (error) {
      console.error('Error loading selected manager:', error);
    }
  };

  const handleManagerSelect = async (manager: User) => {
    try {
      await AsyncStorage.setItem('selectedManagerId', manager.id);
      setSelectedManager(manager);
      console.log('Selected manager:', manager.firstName);
      
      if (onManagerSelect) {
        onManagerSelect(manager);
      }
      
      if (onManagerChange) {
        onManagerChange();
      }
    } catch (error) {
      console.error('Error saving selected manager:', error);
      Alert.alert('Error', 'Failed to save selected manager');
    }
  };

  const handleClearSelection = async () => {
    try {
      await AsyncStorage.removeItem('selectedManagerId');
      setSelectedManager(null);
      console.log('Cleared manager selection');
      
      if (onManagerChange) {
        onManagerChange();
      }
    } catch (error) {
      console.error('Error clearing selected manager:', error);
      Alert.alert('Error', 'Failed to clear selection');
    }
  };

  const handleEditManager = (manager: User) => {
    setEditingManager(manager);
    setFormData({
      email: manager.email,
      username: manager.username,
      firstName: manager.firstName,
      lastName: manager.lastName,
      password: '',
      role: 'Manager',
      companyId: manager.companyId || '',
      isActive: manager.isActive,
      canManagePins: manager.canManagePins,
    });
    setShowFormModal(true);
  };

  const handleDeleteManager = (manager: User) => {
    Alert.alert(
      'Delete Manager',
      `Are you sure you want to delete ${manager.firstName} ${manager.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteUser(manager.id);
              if (response.success) {
                console.log('Manager deleted successfully');
                await loadManagers();
              } else {
                console.error('API error:', response.error);
                Alert.alert('Error', response.error || 'Failed to delete manager');
              }
            } catch (error) {
              console.error('Error deleting manager:', error);
              Alert.alert('Error', 'Failed to delete manager');
            }
          },
        },
      ]
    );
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!formData.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    if (!editingManager && !formData.password) {
      Alert.alert('Error', 'Password is required for new managers');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        console.log('Saving manager to API...');
        
        let response;
        if (editingManager) {
          response = await apiService.updateUser(editingManager.id, formData);
        } else {
          response = await apiService.createUser(formData);
        }

        if (response.success) {
          console.log('Manager saved successfully');
          await loadManagers();
          setShowFormModal(false);
          setEditingManager(null);
          setFormData({ 
            email: '', 
            username: '', 
            firstName: '', 
            lastName: '', 
            password: '', 
            role: 'Manager', 
            companyId: '', 
            isActive: true, 
            canManagePins: false,
          });
        } else {
          console.error('API error:', response.error);
          Alert.alert('Error', response.error || 'Failed to save manager');
        }
      } catch (error) {
        console.error('Error saving manager:', error);
        Alert.alert('Error', 'Failed to save manager');
      }
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
    // Only Admin can assign Manager role
    if (currentUser?.role === 'Admin') {
      return ['User', 'Manager', 'Admin'];
    }
    return ['User', 'Manager'];
  };

  if (managers.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="supervisor-account" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Managers Yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your first manager to get started
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Managers</Text>
        <TouchableOpacity
          style={styles.addManagerButton}
          onPress={() => {
            setEditingManager(null);
            setFormData({ 
              email: '', 
              username: '', 
              firstName: '', 
              lastName: '', 
              password: '', 
              role: 'Manager', 
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

      <ScrollView style={styles.managersList} showsVerticalScrollIndicator={false}>
        {managers.map((manager) => (
          <View key={manager.id} style={[
            styles.managerItem,
            selectedManager?.id === manager.id && styles.selectedManagerItem
          ]}>
            <TouchableOpacity
              style={styles.managerInfo}
              onPress={() => handleManagerSelect(manager)}
            >
              <View style={[styles.managerIcon, { backgroundColor: getRoleColor(manager.role) }]}>
                <MaterialIcons name="supervisor-account" size={20} color="white" />
              </View>
              <View style={styles.managerDetails}>
                <Text style={[
                  styles.managerName,
                  selectedManager?.id === manager.id && styles.selectedManagerName
                ]}>
                  {manager.firstName} {manager.lastName}
                </Text>
                <Text style={styles.managerEmail}>{manager.email}</Text>
                {manager.companyId && currentUser?.role === 'Admin' && (
                  <Text style={styles.managerRole}>
                    Company: {companies.find(c => c.id === manager.companyId)?.name || manager.companyId}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            
            <View style={styles.managerActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditManager(manager)}
              >
                <MaterialIcons name="edit" size={20} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteManager(manager)}
              >
                <MaterialIcons name="delete" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {selectedManager && (
        <TouchableOpacity
          style={styles.clearSelectionButton}
          onPress={handleClearSelection}
        >
          <MaterialIcons name="clear" size={20} color="#FF3B30" />
          <Text style={styles.clearSelectionText}>Clear Selection</Text>
        </TouchableOpacity>
      )}

      {/* Manager Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingManager ? 'Edit Manager' : 'Add New Manager'}
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

            {!editingManager && (
              <View style={styles.formField}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(value) => updateField('password', value)}
                    placeholder="Enter password"
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
              <Text style={styles.saveButtonText}>{editingManager ? 'Update' : 'Create'}</Text>
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
  managersList: {
    gap: 12,
  },
  managerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedManagerItem: {
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
  addManagerButton: {
    backgroundColor: '#FF9500',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  managerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  managerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  managerDetails: {
    flex: 1,
  },
  managerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  selectedManagerName: {
    fontWeight: '600',
    color: '#007AFF',
  },
  managerEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  managerRole: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
    marginTop: 2,
  },
  managerCompany: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  managerActions: {
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