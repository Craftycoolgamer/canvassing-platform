import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Business, Company } from '../types';

interface BusinessStatusNotesModalProps {
  visible: boolean;
  business: Business;
  companies: Company[];
  onClose: () => void;
  onSave: (status: Business['status'], notes: string[]) => void;
}

export const BusinessStatusNotesModal: React.FC<BusinessStatusNotesModalProps> = ({
  visible,
  business,
  companies,
  onClose,
  onSave,
}) => {
  // Add null checks to prevent errors
  if (!business) {
    return null;
  }

  const [status, setStatus] = useState<Business['status']>(business.status);
  const [notes, setNotes] = useState<string[]>(business.notes || []);

  // Update state when business changes
  useEffect(() => {
    if (business) {
      setStatus(business.status);
      setNotes(business.notes || []);
    }
  }, [business]);

  const updateNote = (index: number, value: string) => {
    setNotes(prev => {
      const arr = [...prev];
      arr[index] = value;
      return arr;
    });
  };
  const addNote = () => setNotes(prev => [...prev, '']);
  const removeNote = (index: number) => setNotes(prev => prev.filter((_, i) => i !== index));

  const handleSave = () => {
    if (!status) {
      Alert.alert('Status is required');
      return;
    }
    onSave(status, notes);
  };

  const company = companies.find(c => c.id === business.companyId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{business.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingVertical: 8 }}>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color="#666" />
              <Text style={styles.infoText}>{business.address}</Text>
            </View>
            {business.phone ? (
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={20} color="#666" />
                <Text style={styles.infoText}>{business.phone}</Text>
              </View>
            ) : null}
            {business.email ? (
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color="#666" />
                <Text style={styles.infoText}>{business.email}</Text>
              </View>
            ) : null}
            {business.website ? (
              <View style={styles.infoRow}>
                <MaterialIcons name="language" size={20} color="#666" />
                <Text style={styles.infoText}>{business.website}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <MaterialIcons name="business" size={20} color="#666" />
              <Text style={styles.infoText}>{company?.name || business.companyId}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="flag" size={20} color="#666" />
              <Text style={styles.infoText}>Status:</Text>
            </View>
            <View style={styles.statusContainer}>
              {(['pending', 'contacted', 'completed', 'not-interested'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusOption, status === s && styles.selectedStatus]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.statusText, status === s && styles.selectedStatusText]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="note" size={20} color="#666" />
              <Text style={styles.infoText}>Notes:</Text>
            </View>
            {notes.map((note, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginHorizontal: 16 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={note}
                  onChangeText={value => updateNote(idx, value)}
                  placeholder={`Note #${idx + 1}`}
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity onPress={() => removeNote(idx)} style={{ marginLeft: 8 }}>
                  <MaterialIcons name="remove-circle" size={24} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addNote} style={{ marginTop: 8, marginHorizontal: 16, alignSelf: 'flex-start' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="add-circle" size={20} color="#007AFF" />
                <Text style={{ color: '#007AFF', marginLeft: 6, fontSize: 16, fontWeight: '500' }}>Add Note</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 0,
    paddingTop: 0,
    width: '100%',
    alignSelf: 'center',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    marginHorizontal: 16,
    paddingVertical: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    lineHeight: 22,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 44,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 8,
    marginTop: 4,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    marginRight: 6,
    marginBottom: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedStatus: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedStatusText: {
    color: 'white',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
}); 