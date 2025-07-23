import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Business, Company, BusinessFormData } from '../types';
import { validateEmail, validatePhone, validateWebsite } from '../utils';
import { useAuth } from '../contexts/AuthContext';

// Phone number formatting function
const formatPhoneNumber = (input: string): string => {
  // Remove all non-numeric characters
  const cleaned = input.replace(/\D/g, '');
  
  // Format the number as (XXX) XXX-XXXX
  if (cleaned.length >= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length > 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length > 3) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else if (cleaned.length > 0) {
    return `(${cleaned}`;
  }
  return cleaned;
};

// Phone number validation function
const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // Check if it's exactly 10 digits
  return cleaned.length === 10;
};

interface BusinessFormProps {
  business?: Business;
  companies: Company[];
  onSubmit: (data: BusinessFormData) => void;
  onCancel: () => void;
  initialCoordinates?: { latitude: number; longitude: number } | null;
}

export const BusinessForm: React.FC<BusinessFormProps> = ({
  business,
  companies,
  onSubmit,
  onCancel,
  initialCoordinates,
}) => {
  console.log('BusinessForm - companies received:', companies.length);
  console.log('BusinessForm - companies:', companies);

  const { user: currentUser } = useAuth();
  const canManagePins = currentUser?.canManagePins || false;

  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    notes: [],
    latitude: 0,
    longitude: 0,
    companyId: '',
    status: 'pending',
  });

  const [errors, setErrors] = useState<Partial<BusinessFormData>>({});
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name,
        address: business.address,
        phone: formatPhoneNumber(business.phone), // Format existing phone number
        email: business.email,
        website: business.website,
        notes: business.notes || [],
        latitude: business.latitude,
        longitude: business.longitude,
        companyId: business.companyId,
        status: business.status,
      });
    } else {
      // For new business, use initial coordinates if provided
      if (initialCoordinates) {
        setFormData(prev => ({
          ...prev,
          latitude: initialCoordinates.latitude,
          longitude: initialCoordinates.longitude,
        }));
      }
      
      // Set company based on user role
      if (companies.length > 0) {
        if (currentUser?.role === 'Admin') {
          // Admin can choose any company, default to first one
          console.log('Setting default company for admin:', companies[0].id);
          setFormData(prev => ({ ...prev, companyId: companies[0].id }));
        } else {
          // Non-admin users are restricted to their assigned company
          const userCompany = companies.find(company => company.id === currentUser?.companyId);
          if (userCompany) {
            console.log('Setting user company:', userCompany.id);
            setFormData(prev => ({ ...prev, companyId: userCompany.id }));
          }
        }
      }
    }
  }, [business, companies, initialCoordinates, currentUser]);

  const validateForm = (): boolean => {
    const newErrors: Partial<BusinessFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Company is required';
    }

    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.website && !validateWebsite(formData.website)) {
      newErrors.website = 'Invalid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!canManagePins) {
      return;
    }

    if (validateForm()) {
      // Clean phone number before submitting
      const submissionData = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''),
      };
      onSubmit(submissionData);
    }
  };

  const updateField = (field: keyof BusinessFormData, value: string | number) => {
    // Format phone number if the field is 'phone'
    if (field === 'phone') {
      value = formatPhoneNumber(value as string);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const updateNote = (index: number, value: string) => {
    setFormData(prev => {
      const notes = [...prev.notes];
      notes[index] = value;
      return { ...prev, notes };
    });
  };

  const addNote = () => {
    setFormData(prev => ({ ...prev, notes: [...prev.notes, ''] }));
  };

  const removeNote = (index: number) => {
    setFormData(prev => {
      const notes = [...prev.notes];
      notes.splice(index, 1);
      return { ...prev, notes };
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {business ? 'Edit Business' : 'Add New Business'}
        </Text>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Business Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError, !canManagePins && styles.disabledInput]}
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder="Enter business name"
            editable={canManagePins}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, errors.address && styles.inputError, !canManagePins && styles.disabledInput]}
            value={formData.address}
            onChangeText={(value) => updateField('address', value)}
            placeholder="Enter address"
            multiline
            editable={canManagePins}
          />
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError, !canManagePins && styles.disabledInput]}
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={canManagePins}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 3 }]}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError, !canManagePins && styles.disabledInput]}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              editable={canManagePins}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={[styles.field, { flex: 2, marginLeft: 12 }]}>
            <Text style={styles.label}>Status</Text>
            <TouchableOpacity
              style={[
                styles.dropdown,
                !canManagePins && styles.disabledInput
              ]}
              disabled={!canManagePins}
              onPress={() => canManagePins && setShowStatusModal(true)}
            >
              <Text style={[
                styles.dropdownText,
                !canManagePins && styles.disabledText
              ]}>
                {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={canManagePins ? "#666" : "#888"} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={[styles.input, errors.website && styles.inputError, !canManagePins && styles.disabledInput]}
            value={formData.website}
            onChangeText={(value) => updateField('website', value)}
            placeholder="Enter website URL"
            keyboardType="url"
            autoCapitalize="none"
            editable={canManagePins}
          />
          {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Company</Text>
          {currentUser?.role === 'Admin' ? (
            // Admin can see all companies with picker interface
            <View style={[styles.pickerContainer, errors.companyId && styles.inputError]}>
              {companies.map((company) => (
                <TouchableOpacity
                  key={company.id}
                  style={[
                    styles.companyOption,
                    formData.companyId === company.id && styles.selectedCompany,
                    !canManagePins && styles.disabledOption,
                  ]}
                  onPress={() => canManagePins && updateField('companyId', company.id)}
                  disabled={!canManagePins}
                >
                  <View style={[styles.companyIcon, { backgroundColor: company.color }]}>
                    <MaterialIcons name={company.pinIcon as any} size={16} color="white" />
                  </View>
                  <Text style={styles.companyName}>{company.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            // Non-admin users see just their company icon and name
            companies
              .filter(company => company.id === currentUser?.companyId)
              .map((company) => (
                <View key={company.id} style={styles.companyDisplay}>
                  <View style={[styles.companyIcon, { backgroundColor: company.color }]}>
                    <MaterialIcons name={company.pinIcon as any} size={20} color="white" />
                  </View>
                  <Text style={styles.companyDisplayText}>{company.name}</Text>
                </View>
              ))
          )}
          {errors.companyId && <Text style={styles.errorText}>{errors.companyId}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          {formData.notes.map((note, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginHorizontal: 16 }}>
              <TextInput
                style={[styles.input, { flex: 1 }, !canManagePins && styles.disabledInput]}
                value={note}
                onChangeText={(value) => updateNote(idx, value)}
                placeholder={`Note #${idx + 1}`}
                multiline
                numberOfLines={2}
                editable={canManagePins}
              />
              {canManagePins && (
                <TouchableOpacity onPress={() => removeNote(idx)} style={{ marginLeft: 8 }}>
                  <MaterialIcons name="remove-circle" size={24} color="#ff3b30" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {canManagePins && (
            <TouchableOpacity onPress={addNote} style={{ marginTop: 4, alignSelf: 'flex-start' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="add-circle" size={20} color="#007AFF" />
                <Text style={{ color: '#007AFF', marginLeft: 4 }}>Add Note</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitBtn, !canManagePins && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={!canManagePins}
          >
            <Text style={[styles.submitBtnText, !canManagePins && styles.disabledButtonText]}>
              {!canManagePins ? 'No Permission' : (business ? 'Update' : 'Add') + ' Business'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {(['pending', 'contacted', 'completed', 'not-interested'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  formData.status === status && styles.selectedStatus
                ]}
                onPress={() => {
                  updateField('status', status);
                  setShowStatusModal(false);
                }}
              >
                <Text style={[
                  styles.statusOptionText,
                  formData.status === status && styles.selectedStatusText
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
                {formData.status === status && (
                  <MaterialIcons name="check" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelButton: {
    padding: 4,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
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
  inputError: {
    borderColor: '#ff3b30',
  },
  disabledInput: {
    backgroundColor: '#e0e0e0',
    color: '#888',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
  },
  companyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedCompany: {
    backgroundColor: '#f0f8ff',
  },
  companyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  companyName: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  companyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  companyDisplayText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  submitBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  disabledOption: {
    opacity: 0.7,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#888',
  },
  dropdown: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  disabledText: {
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedStatus: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  selectedStatusText: {
    color: '#007AFF',
    fontWeight: '500',
  },
}); 