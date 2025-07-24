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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Business } from '../types';
import { BusinessCard } from '../components/BusinessCard';
import { BusinessForm } from '../components/BusinessForm';
import { searchBusinesses, filterBusinessesByStatus } from '../utils';
import { BusinessStatusNotesModal } from '../components/BusinessStatusNotesModal';
import { BusinessAssignmentModal } from '../components/BusinessAssignmentModal';
import { LocationUpdateScreen } from './LocationUpdateScreen';
import { useAuth } from '../contexts/AuthContext';
import { useDataManager } from '../hooks/useDataManager';

export const BusinessListScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const canManagePins = currentUser?.canManagePins || false;

  // Use the centralized data manager
  const {
    businesses,
    companies,
    users,
    selectedCompany,
    setSelectedCompany,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    syncAllData,
  } = useDataManager();

  // Local state for UI
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [displayedBusinesses, setDisplayedBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Business['status']>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStatusNotesModal, setShowStatusNotesModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentBusiness, setAssignmentBusiness] = useState<Business | null>(null);

  // Load data when component mounts
  useEffect(() => {
    syncAllData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('BusinessListScreen focused - refreshing data...');
      syncAllData();
    }, [syncAllData])
  );

  // Filter businesses based on selected company and user permissions
  useEffect(() => {
    let filtered = businesses;

    // Apply company filter if user can manage pins and a company is selected
    if (canManagePins && selectedCompany) {
      filtered = filtered.filter(business => business.companyId === selectedCompany.id);
    } else if (!canManagePins && currentUser) {
      // For users without pin permissions, only show assigned businesses
      filtered = filtered.filter(business => business.assignedUserId === currentUser.id);
    }

    setFilteredBusinesses(filtered);
    console.log('Businesses filtered:', filtered.length);
  }, [businesses, selectedCompany, canManagePins, currentUser]);

  // Apply search and status filters
  useEffect(() => {
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
  }, [filteredBusinesses, searchQuery, statusFilter]);

  const handleBusinessPress = (business: Business) => {
    if (canManagePins) {
      setEditingBusiness(business);
      setShowFormModal(true);
    } else {
      setSelectedBusiness(business);
      setShowStatusNotesModal(true);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      console.log('Saving business...');
      
      if (editingBusiness) {
        // Update existing business
        await updateBusiness(editingBusiness.id, formData);
      } else {
        // Create new business
        await createBusiness(formData);
      }

      console.log('Business saved successfully');
      setShowFormModal(false);
      setEditingBusiness(null);
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
              console.log('Deleting business...');
              await deleteBusiness(business.id);
              console.log('Business deleted successfully');
            } catch (error) {
              console.error('Error deleting business:', error);
              Alert.alert('Error', 'Failed to delete business');
            }
          },
        },
      ]
    );
  };

  const handleStatusNotesSave = async (status: Business['status'], notes: string[]) => {
    if (!selectedBusiness) return;
    try {
      // Create updated business object with only status and notes changed
      const updatedBusiness = {
        ...selectedBusiness,
        status,
        notes,
      };
      
      await updateBusiness(selectedBusiness.id, updatedBusiness);
      setShowStatusNotesModal(false);
      setSelectedBusiness(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update business');
    }
  };

  const handleBusinessAssignment = (business: Business) => {
    setAssignmentBusiness(business);
    setShowAssignmentModal(true);
  };

  const handleAssignmentChange = () => {
    syncAllData(); // Refresh the data after assignment change
  };

  const handleUpdateLocation = (business: Business) => {
    const company = getCompanyForBusiness(business);
    if (company) {
      (navigation as any).navigate('LocationUpdate', { business, company });
    }
  };

  const getCompanyForBusiness = (business: Business) => {
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
        onAssign={() => handleBusinessAssignment(item)}
        onUpdateLocation={() => handleUpdateLocation(item)}
        showAssignButton={currentUser?.role === 'Admin' || currentUser?.role === 'Manager'}
        showUpdateLocationButton={canManagePins}
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

      {/* Status/Notes Modal for users without pin permissions */}
      {selectedBusiness && (
        <BusinessStatusNotesModal
          visible={showStatusNotesModal}
          business={selectedBusiness}
          companies={companies}
          onClose={() => { setShowStatusNotesModal(false); setSelectedBusiness(null); }}
          onSave={handleStatusNotesSave}
        />
      )}

      {/* Business Assignment Modal */}
      {assignmentBusiness && (
        <BusinessAssignmentModal
          visible={showAssignmentModal}
          business={assignmentBusiness}
          users={users}
          companies={companies}
          onClose={() => { setShowAssignmentModal(false); setAssignmentBusiness(null); }}
          onAssignmentChange={handleAssignmentChange}
        />
      )}
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