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
import { Company, CompanyFormData } from '../types';
import { apiService } from '../services/api';
import { StorageService } from '../services/storage';

interface CompanySelectorProps {
  onCompanySelect?: (company: Company) => void;
  showActions?: boolean;
  onCompanyChange?: () => void;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  onCompanySelect,
  showActions = true,
  onCompanyChange,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    pinIcon: 'business',
    color: '#007AFF',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      console.log('Loading companies from API...');
      const response = await apiService.getCompanies();
      
      if (response.success && response.data) {
        setCompanies(response.data);
        console.log('Loaded companies from API:', response.data.length);
        await loadSelectedCompany(response.data);
      } else {
        console.log('API failed, loading from local storage');
        const companiesData = await StorageService.getCompanies();
        setCompanies(companiesData);
        await loadSelectedCompany(companiesData);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      try {
        const companiesData = await StorageService.getCompanies();
        setCompanies(companiesData);
        await loadSelectedCompany(companiesData);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        Alert.alert('Error', 'Failed to load companies');
      }
    }
  };

  const loadSelectedCompany = async (companiesList: Company[] = companies) => {
    try {
      const selectedCompanyId = await AsyncStorage.getItem('selectedCompanyId');
      if (selectedCompanyId) {
        const company = companiesList.find(c => c.id === selectedCompanyId);
        setSelectedCompany(company || null);
        console.log('Selected company:', company?.name);
      }
    } catch (error) {
      console.error('Error loading selected company:', error);
    }
  };

  const handleCompanySelect = async (company: Company) => {
    try {
      await AsyncStorage.setItem('selectedCompanyId', company.id);
      setSelectedCompany(company);
      console.log('Selected company:', company.name);
      
      // Call parent callback if provided
      if (onCompanySelect) {
        onCompanySelect(company);
      }
      
      // Notify parent that company selection changed
      if (onCompanyChange) {
        onCompanyChange();
      }
    } catch (error) {
      console.error('Error saving selected company:', error);
      Alert.alert('Error', 'Failed to save selected company');
    }
  };

  const handleClearSelection = async () => {
    try {
      await AsyncStorage.removeItem('selectedCompanyId');
      setSelectedCompany(null);
      console.log('Cleared company selection');
      
      // Notify parent that company selection changed
      if (onCompanyChange) {
        onCompanyChange();
      }
    } catch (error) {
      console.error('Error clearing selected company:', error);
      Alert.alert('Error', 'Failed to clear selection');
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      pinIcon: company.pinIcon,
      color: company.color,
    });
    setShowFormModal(true);
  };

  const handleDeleteCompany = (company: Company) => {
    Alert.alert(
      'Delete Company',
      `Are you sure you want to delete "${company.name}"? This will also delete all associated businesses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting company from API...');
              const response = await apiService.deleteCompany(company.id);
              
              if (response.success) {
                console.log('Company deleted successfully');
                await loadCompanies();
                
                // If the deleted company was selected, clear selection
                if (selectedCompany?.id === company.id) {
                  await handleClearSelection();
                }
              } else {
                console.error('API error:', response.error);
                Alert.alert('Error', response.error || 'Failed to delete company');
              }
            } catch (error) {
              console.error('Error deleting company:', error);
              Alert.alert('Error', 'Failed to delete company');
            }
          },
        },
      ]
    );
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Company name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        console.log('Saving company to API...');
        
        let response;
        if (editingCompany) {
          response = await apiService.updateCompany(editingCompany.id, formData);
        } else {
          response = await apiService.createCompany(formData);
        }

        if (response.success) {
          console.log('Company saved successfully');
          await loadCompanies();
          setShowFormModal(false);
          setEditingCompany(null);
          setFormData({ name: '', pinIcon: 'business', color: '#007AFF' });
        } else {
          console.error('API error:', response.error);
          Alert.alert('Error', response.error || 'Failed to save company');
        }
      } catch (error) {
        console.error('Error saving company:', error);
        Alert.alert('Error', 'Failed to save company');
      }
    }
  };

  const updateField = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (companies.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="business" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Companies Yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your first company to get started
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Companies</Text>
        {/* Add Company Button */}
        <TouchableOpacity
          style={styles.addCompanyButton}
          onPress={() => {
            setEditingCompany(null);
            setFormData({ name: '', pinIcon: 'business', color: '#007AFF' });
            setShowFormModal(true);
          }}
        >
        <MaterialIcons name="add" size={20} color="white" />
      </TouchableOpacity>



      </View>
      

      <ScrollView style={styles.companiesList} showsVerticalScrollIndicator={false}>
        {companies.map((company) => (
          <View key={company.id} style={[
            styles.companyItem,
            selectedCompany?.id === company.id && styles.selectedCompanyItem
          ]}>
            <TouchableOpacity
              style={styles.companyInfo}
              onPress={() => handleCompanySelect(company)}
            >
              <View style={[styles.companyIcon, { backgroundColor: company.color }]}>
                <MaterialIcons name={company.pinIcon as any} size={20} color="white" />
              </View>
              <View style={styles.companyDetails}>
                <Text style={[
                  styles.companyName,
                  selectedCompany?.id === company.id && styles.selectedCompanyName
                ]}>
                  {company.name}
                </Text>
                <Text style={styles.companyDate}>
                  Created: {new Date(company.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
            
            {showActions && (
              <View style={styles.companyActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditCompany(company)}
                >
                  <MaterialIcons name="edit" size={20} color="#007AFF" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCompany(company)}
                >
                  <MaterialIcons name="delete" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {selectedCompany && (
        <TouchableOpacity
          style={styles.clearSelectionButton}
          onPress={handleClearSelection}
        >
          <MaterialIcons name="clear" size={20} color="#FF3B30" />
          <Text style={styles.clearSelectionText}>Clear Selection</Text>
        </TouchableOpacity>
      )}

      {/* Company Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCompany ? 'Edit Company' : 'Add New Company'}
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
              <Text style={styles.label}>Company Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Enter company name"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Pin Icon</Text>
              <View style={styles.iconGrid}>
                {['business', 'store', 'local-movies', 'restaurant', 'hotel', 'shopping-cart'].map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      formData.pinIcon === icon && styles.selectedIcon,
                    ]}
                    onPress={() => updateField('pinIcon', icon)}
                  >
                    <MaterialIcons name={icon as any} size={24} color={formData.pinIcon === icon ? 'white' : '#666'} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {['#007AFF', '#FF9500', '#34C759', '#FF3B30', '#AF52DE', '#FF6B9D'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formData.color === color && styles.selectedColor,
                    ]}
                    onPress={() => updateField('color', color)}
                  />
                ))}
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
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  companiesList: {
    gap: 12,
  },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCompanyItem: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#e0f2fe',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  selectedCompanyName: {
    fontWeight: '600',
    color: '#007AFF',
  },
  companyDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  companyActions: {
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
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
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
    padding: 16,
  },
  formField: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  selectedIcon: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#007AFF',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  addCompanyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCompanyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 