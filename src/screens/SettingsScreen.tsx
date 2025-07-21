import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CompanySelector } from '../components/CompanySelector';
import { useFocusEffect } from '@react-navigation/native';

export const SettingsScreen: React.FC = () => {
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  const handleCompanyChange = () => {
    // This will trigger a refresh of data in other screens when they come into focus
    console.log('Company selection changed, other screens will refresh on focus');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Companies Section */}
        <TouchableOpacity onPress={() => setShowCompanySelector(!showCompanySelector)}>
          <View style={styles.section}>
            {showCompanySelector? <CompanySelector showActions={false} onCompanyChange={handleCompanyChange}/> : <Text style={styles.sectionTitle} >Select a company</Text>}
          </View>
        </TouchableOpacity>
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
    marginBottom: 4,
    alignItems: 'center',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCompanyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  selectedCompanyInfo: {
    flex: 1,
    marginLeft: 12,
  },

  selectedCompanySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
  },
  noSelectionContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  noSelectionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
  },
  noSelectionSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },

}); 