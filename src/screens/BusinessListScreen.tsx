import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Business, Company } from '../types';
import { StorageService } from '../services/storage';
import { apiService } from '../services/api';
import { BusinessCard } from '../components/BusinessCard';
import { BusinessForm } from '../components/BusinessForm';
import { searchBusinesses, filterBusinessesByStatus } from '../utils';

export const BusinessListScreen: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [displayedBusinesses, setDisplayedBusinesses] = useState<Business[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Business['status']>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('BusinessListScreen focused - refreshing data...');
      loadData();
    }, [])
  );

  useEffect(() => {
    filterAndSearchBusinesses();
  }, [filteredBusinesses, searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      console.log('Loading data from API...');
      
      // Load companies first
      const companiesResponse = await apiService.getCompanies();
      let companiesData: Company[] = [];

      if (companiesResponse.success && companiesResponse.data) {
        companiesData = companiesResponse.data;
        console.log('Loaded companies from API:', companiesData.length);
      } else {
        console.log('API failed, loading from local storage');
        companiesData = await StorageService.getCompanies();
      }

      setCompanies(companiesData);

      // Load selected company to determine which businesses to fetch
      const selectedCompanyId = await AsyncStorage.getItem('selectedCompanyId');
      
      let businessesData: Business[] = [];
      
      if (selectedCompanyId) {
        // Load businesses for the selected company
        console.log('Loading businesses for selected company:', selectedCompanyId);
        const businessesResponse = await apiService.getBusinessesByCompany(selectedCompanyId);
        
        if (businessesResponse.success && businessesResponse.data) {
          businessesData = businessesResponse.data;
          console.log('Loaded businesses for company from API:', businessesData.length);
        } else {
          console.log('API failed, loading from local storage');
          businessesData = await StorageService.getBusinessesByCompany(selectedCompanyId);
        }
      } else {
        // Load all businesses if no company is selected
        console.log('No company selected, loading all businesses');
        const businessesResponse = await apiService.getBusinesses();
        
        if (businessesResponse.success && businessesResponse.data) {
          businessesData = businessesResponse.data;
          console.log('Loaded all businesses from API:', businessesData.length);
        } else {
          console.log('API failed, loading from local storage');
          businessesData = await StorageService.getBusinesses();
        }
      }

      console.log('Final loaded businesses:', businessesData.length);
      console.log('Final loaded companies:', companiesData.length);
      
      setBusinesses(businessesData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to local storage
      try {
        const [businessesData, companiesData] = await Promise.all([
          StorageService.getBusinesses(),
          StorageService.getCompanies(),
        ]);
        setBusinesses(businessesData);
        setCompanies(companiesData);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        Alert.alert('Error', 'Failed to load data');
      }
    }
  };

  const loadSelectedCompany = async () => {
    try {
      const selectedCompanyId = await AsyncStorage.getItem('selectedCompanyId');
      if (selectedCompanyId) {
        const company = companies.find(c => c.id === selectedCompanyId);
        setSelectedCompany(company || null);
        console.log('Selected company for filtering:', company?.name || 'Not found');
      } else {
        setSelectedCompany(null);
        console.log('No company selected - showing all businesses');
      }
    } catch (error) {
      console.error('Error loading selected company:', error);
      setSelectedCompany(null);
    }
  };

  // Load selected company when companies are loaded
  useEffect(() => {
    if (companies.length > 0) {
      loadSelectedCompany();
    }
  }, [companies]);

  // Filter businesses based on selected company
  useEffect(() => {
    setFilteredBusinesses(businesses);
    console.log('Businesses loaded:', businesses.length);
  }, [businesses]);

  const filterAndSearchBusinesses = () => {
    let filtered = filteredBusinesses;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filterBusinessesByStatus(filtered, statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchBusinesses(filtered, searchQuery);
    }

    console.log('filterAndSearchBusinesses - filteredBusinesses:', filteredBusinesses.length);
    console.log('filterAndSearchBusinesses - statusFilter:', statusFilter);
    console.log('filterAndSearchBusinesses - searchQuery:', searchQuery);
    console.log('filterAndSearchBusinesses - final displayedBusinesses:', filtered.length);
    
    setDisplayedBusinesses(filtered);
  };

  const handleBusinessPress = (business: Business) => {
    setEditingBusiness(business);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      console.log('Saving business to API...');
      
      let response;
      if (editingBusiness) {
        // Update existing business
        response = await apiService.updateBusiness(editingBusiness.id, formData);
      } else {
        // Create new business
        response = await apiService.createBusiness(formData);
      }

      if (response.success) {
        console.log('Business saved successfully');
        await loadData();
        setShowFormModal(false);
        setEditingBusiness(null);
      } else {
        console.error('API error:', response.error);
        Alert.alert('Error', response.error || 'Failed to save business');
      }
    } catch (error) {
      console.error('Error saving business:', error);
      Alert.alert('Error', 'Failed to save business');
    }
  };

  const handleDeleteBusiness = (business: Business) => {
    Alert.alert(
      'Delete Business',
      `Are you sure you want to delete "${business.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting business from API...');
              const response = await apiService.deleteBusiness(business.id);
              
              if (response.success) {
                console.log('Business deleted successfully');
                await loadData();
              } else {
                console.error('API error:', response.error);
                Alert.alert('Error', response.error || 'Failed to delete business');
              }
            } catch (error) {
              console.error('Error deleting business:', error);
              Alert.alert('Error', 'Failed to delete business');
            }
          },
        },
      ]
    );
  };

  const getCompanyForBusiness = (business: Business): Company | undefined => {
    return companies.find(company => company.id === business.companyId);
  };

  const renderBusinessItem = ({ item }: { item: Business }) => {
    const company = getCompanyForBusiness(item);
    console.log('renderBusinessItem - business:', item.name, 'company found:', !!company);
    if (!company) {
      console.log('renderBusinessItem - no company found for business:', item.name, 'companyId:', item.companyId);
      return null;
    }

    return (
      <BusinessCard
        business={item}
        company={company}
        onPress={() => handleBusinessPress(item)}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="business" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>
        {selectedCompany ? `No businesses found for ${selectedCompany.name}` : 'No businesses found'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery || statusFilter !== 'all'
          ? 'Try adjusting your search or filters'
          : selectedCompany 
            ? `Add your first business for ${selectedCompany.name}`
            : 'Add your first business to get started'}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search businesses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <MaterialIcons name="filter-list" size={20} color="#007AFF" />
        <Text style={styles.filterButtonText}>Filter</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filterLabel}>Status Filter:</Text>
      <View style={styles.statusFilters}>
        {(['all', 'pending', 'contacted', 'completed', 'not-interested'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusFilterButton,
              statusFilter === status && styles.selectedStatusFilter,
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.statusFilterText,
                statusFilter === status && styles.selectedStatusFilterText,
              ]}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Business List</Text>
        {selectedCompany && (
          <View style={styles.filterIndicator}>
            <View style={[styles.companyIcon, { backgroundColor: selectedCompany.color }]}>
              <MaterialIcons name={selectedCompany.pinIcon as any} size={16} color="white" />
            </View>
            <Text style={styles.filterText}>{selectedCompany.name}</Text>
          </View>
        )}
      </View>

      {renderHeader()}
      
      {showFilters && renderFilters()}

      <FlatList
        data={displayedBusinesses}
        renderItem={renderBusinessItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        onLayout={() => console.log('FlatList onLayout - displayedBusinesses count:', displayedBusinesses.length)}
        onContentSizeChange={() => console.log('FlatList onContentSizeChange - displayedBusinesses count:', displayedBusinesses.length)}
      />

      {/* Business Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFormModal(false)}
      >
        <BusinessForm
          business={editingBusiness || undefined}
          companies={companies}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowFormModal(false);
            setEditingBusiness(null);
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: '#f8f9fa',
  },
  screenHeader: {
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    flex: 1,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  companyIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  selectedStatusFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusFilterText: {
    fontSize: 14,
    color: '#666',
  },
  selectedStatusFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
}); 