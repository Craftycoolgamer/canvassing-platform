import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Business, Company, BusinessFormData } from '../types';
import { validateEmail, validatePhone, validateWebsite } from '../utils';

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

  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    notes: '',
    latitude: 0,
    longitude: 0,
    companyId: '',
    status: 'pending',
  });

  const [errors, setErrors] = useState<Partial<BusinessFormData>>({});

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name,
        address: business.address,
        phone: business.phone,
        email: business.email,
        website: business.website,
        notes: business.notes,
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
      
      if (companies.length > 0) {
        console.log('Setting default company:', companies[0].id);
        setFormData(prev => ({ ...prev, companyId: companies[0].id }));
      }
    }
  }, [business, companies, initialCoordinates]);

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

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    if (formData.website && !validateWebsite(formData.website)) {
      newErrors.website = 'Invalid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = (field: keyof BusinessFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
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
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder="Enter business name"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, errors.address && styles.inputError]}
            value={formData.address}
            onChangeText={(value) => updateField('address', value)}
            placeholder="Enter address"
            multiline
          />
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={[styles.input, errors.website && styles.inputError]}
            value={formData.website}
            onChangeText={(value) => updateField('website', value)}
            placeholder="Enter website URL"
            keyboardType="url"
            autoCapitalize="none"
          />
          {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Company *</Text>
          <View style={[styles.pickerContainer, errors.companyId && styles.inputError]}>
            {companies.map((company) => (
              <TouchableOpacity
                key={company.id}
                style={[
                  styles.companyOption,
                  formData.companyId === company.id && styles.selectedCompany,
                ]}
                onPress={() => updateField('companyId', company.id)}
              >
                <View style={[styles.companyIcon, { backgroundColor: company.color }]}>
                  <MaterialIcons name={company.pinIcon as any} size={16} color="white" />
                </View>
                <Text style={styles.companyName}>{company.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.companyId && <Text style={styles.errorText}>{errors.companyId}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusContainer}>
            {(['pending', 'contacted', 'completed', 'not-interested'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  formData.status === status && styles.selectedStatus,
                ]}
                onPress={() => updateField('status', status)}
              >
                <Text style={[
                  styles.statusText,
                  formData.status === status && styles.selectedStatusText,
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => updateField('notes', value)}
            placeholder="Enter notes"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>
              {business ? 'Update' : 'Add'} Business
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  selectedStatus: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  selectedStatusText: {
    color: 'white',
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
}); 