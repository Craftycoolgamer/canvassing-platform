import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Business, Company } from '../types';
import { StorageService } from '../services/storage';
import { apiService } from '../services/api';
import { getStatusColor, getStatusText, formatDate } from '../utils';
import { BusinessForm } from '../components/BusinessForm';
import { Map } from '../components/Map';
import { BusinessList } from '../components/BusinessList';
import { useAuth } from '../contexts/AuthContext';
import { BusinessStatusNotesModal } from '../components/BusinessStatusNotesModal';

export const MapScreen: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [mapCenter, setMapCenter] = useState<{latitude: number, longitude: number}>({ latitude: 37.7749, longitude: -122.4194 });
  const mapRef = useRef<any>(null);
  const { user: currentUser } = useAuth();
  const [showStatusNotesModal, setShowStatusNotesModal] = useState(false);

  // Check if user can manage pins
  const canManagePins = currentUser?.canManagePins || false;

  useEffect(() => {
    loadData();
    requestLocationPermission();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('MapScreen focused - refreshing data...');
      loadData();
    }, [])
  );

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

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Sort businesses by distance from map center
  const sortBusinessesByDistance = (businessesToSort: Business[], centerLat: number, centerLon: number): Business[] => {
    return [...businessesToSort].sort((a, b) => {
      const distanceA = calculateDistance(centerLat, centerLon, a.latitude, a.longitude);
      const distanceB = calculateDistance(centerLat, centerLon, b.latitude, b.longitude);
      return distanceA - distanceB;
    });
  };

  // Filter businesses based on selected company
  useEffect(() => {
    // Sort by distance from map center
    const sortedBusinesses = sortBusinessesByDistance(businesses, mapCenter.latitude, mapCenter.longitude);
    setFilteredBusinesses(sortedBusinesses);
  }, [businesses, mapCenter]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleMarkerPress = (business: Business) => {
    setSelectedBusiness(business);
    if (canManagePins) {
      setShowBusinessModal(true);
    } else {
      setShowStatusNotesModal(true);
    }
  };

  const handleBusinessPress = (business: Business) => {
    setSelectedBusiness(business);
    if (canManagePins) {
      setShowBusinessModal(true);
    } else {
      setShowStatusNotesModal(true);
    }
    if (mapRef.current && canManagePins) {
      mapRef.current.zoomToLocation(business.latitude, business.longitude);
    }
  };

  const handleMapTap = (latitude: number, longitude: number) => {
    if (!canManagePins) {
      // Alert.alert(
      //   'Permission Denied',
      //   'You do not have permission to add business pins. Please contact your administrator.',
      //   [{ text: 'OK' }]
      // );
      return;
    }
    
    console.log('Map tapped at:', latitude, longitude);
    setSelectedCoordinates({ latitude, longitude });
    setEditingBusiness(null);
    setShowFormModal(true);
  };

  const handleMapCenterChange = (latitude: number, longitude: number) => {
    console.log('Map center changed to:', latitude, longitude);
    setMapCenter({ latitude, longitude });
  };

  const handleEditBusiness = (business: Business) => {
    if (!canManagePins) {
      // Alert.alert(
      //   'Permission Denied',
      //   'You do not have permission to edit business pins. Please contact your administrator.',
      //   [{ text: 'OK' }]
      // );
      return;
    }

    setEditingBusiness(business);
    setShowBusinessModal(false);
    setShowFormModal(true);
  };

  const handleDeleteBusiness = (business: Business) => {
    if (!canManagePins) {
      // Alert.alert(
      //   'Permission Denied',
      //   'You do not have permission to delete business pins. Please contact your administrator.',
      //   [{ text: 'OK' }]
      // );
      return;
    }

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
                setShowBusinessModal(false);
                setSelectedBusiness(null);
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

  const handleFormSubmit = async (formData: any) => {
    try {
      console.log('Saving business to API...');
      
      // If we have selected coordinates, use them
      const businessData = selectedCoordinates 
        ? { ...formData, latitude: selectedCoordinates.latitude, longitude: selectedCoordinates.longitude }
        : formData;
      
      let response;
      if (editingBusiness) {
        // Update existing business
        response = await apiService.updateBusiness(editingBusiness.id, businessData);
      } else {
        // Create new business
        response = await apiService.createBusiness(businessData);
      }

      if (response.success) {
        console.log('Business saved successfully');
        await loadData();
        setShowFormModal(false);
        setEditingBusiness(null);
        setSelectedCoordinates(null);
      } else {
        console.error('API error:', response.error);
        Alert.alert('Error', response.error || 'Failed to save business');
      }
    } catch (error) {
      console.error('Error saving business:', error);
      Alert.alert('Error', 'Failed to save business');
    }
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
      
      const response = await apiService.updateBusiness(selectedBusiness.id, updatedBusiness);
      if (response.success) {
        await loadData();
        setShowStatusNotesModal(false);
        setSelectedBusiness(null);
      } else {
        Alert.alert('Error', response.error || 'Failed to update business');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update business');
    }
  };

  const getCompanyForBusiness = (business: Business): Company | undefined => {
    return companies.find(company => company.id === business.companyId);
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Businesses</Text>
        {selectedCompany && (
          <View style={styles.filterIndicator}>
            <View style={[styles.companyIcon, { backgroundColor: selectedCompany.color }]}>
              <MaterialIcons name={selectedCompany.pinIcon as any} size={16} color="white" />
            </View>
            <Text style={styles.filterText}>{selectedCompany.name}</Text>
          </View>
        )}
      </View>

      {/* Map Section */}
      <View style={styles.mapSection}>
        <Map
          ref={mapRef}
          businesses={filteredBusinesses}
          companies={companies}
          onMarkerPress={handleMarkerPress}
          onMapTap={handleMapTap}
          userLocation={userLocation?.coords || null}
          onMapCenterChange={handleMapCenterChange}
        />
      </View>

      {/* Business List Section */}
      <View style={styles.listSection}>
        <BusinessList
          businesses={filteredBusinesses}
          companies={companies}
          onBusinessPress={handleBusinessPress}
        />
      </View>

      {/* Business Details Modal */}
      <Modal
        visible={showBusinessModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBusinessModal(false)}
      >
        {selectedBusiness && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedBusiness.name}</Text>
                <TouchableOpacity
                  onPress={() => setShowBusinessModal(false)}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} contentContainerStyle={{flexGrow: 0}}>
                <View style={styles.businessInfo}>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="location-on" size={20} color="#666" />
                    <Text style={styles.infoText}>{selectedBusiness.address}</Text>
                  </View>

                  {selectedBusiness.phone && (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="phone" size={20} color="#666" />
                      <Text style={styles.infoText}>{selectedBusiness.phone}</Text>
                    </View>
                  )}

                  {selectedBusiness.email && (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="email" size={20} color="#666" />
                      <Text style={styles.infoText}>{selectedBusiness.email}</Text>
                    </View>
                  )}

                  {selectedBusiness.website && (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="language" size={20} color="#666" />
                      <Text style={styles.infoText}>{selectedBusiness.website}</Text>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <MaterialIcons name="business" size={20} color="#666" />
                    <Text style={styles.infoText}>
                      {getCompanyForBusiness(selectedBusiness)?.name}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialIcons name="flag" size={20} color="#666" />
                    <Text style={styles.infoText}>{getStatusText(selectedBusiness.status)}</Text>
                  </View>

                  {selectedBusiness.notes && (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="note" size={20} color="#666" />
                      <Text style={styles.infoText}>{selectedBusiness.notes}</Text>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <MaterialIcons name="schedule" size={20} color="#666" />
                    <Text style={styles.infoText}>
                      Added: {formatDate(selectedBusiness.createdAt)}
                    </Text>
                  </View>

                  {selectedBusiness.lastContactDate && (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="event" size={20} color="#666" />
                      <Text style={styles.infoText}>
                        Last Contact: {formatDate(selectedBusiness.lastContactDate)}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                {canManagePins && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditBusiness(selectedBusiness)}
                  >
                    <MaterialIcons name="edit" size={20} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}

                {canManagePins && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteBusiness(selectedBusiness)}
                  >
                    <MaterialIcons name="delete" size={20} color="#FF3B30" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                )}

                {!canManagePins && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewOnlyButton]}
                    onPress={() => setShowBusinessModal(false)}
                  >
                    <MaterialIcons name="close" size={20} color="#666" />
                    <Text style={[styles.actionButtonText, styles.viewOnlyButtonText]}>Close</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
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

      {/* Business Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowFormModal(false);
          setEditingBusiness(null);
          setSelectedCoordinates(null);
        }}
      >
        <BusinessForm
          business={editingBusiness || undefined}
          companies={companies}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowFormModal(false);
            setEditingBusiness(null);
            setSelectedCoordinates(null);
          }}
          initialCoordinates={selectedCoordinates}
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
  header: {
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
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
  mapSection: {
    flex: 2,
    backgroundColor: 'white',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    marginBottom: 5,
  },
  listSection: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
    
  },
  modalContainer: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 0,
    paddingTop: 0,
    width: '100%',
    alignSelf: 'center', // Center horizontally
    // Remove maxHeight and let content dictate height
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    // Remove flex: 1 and padding
    // Add maxHeight for overflow only
    maxHeight: 400,
    padding: 16,
  },
  businessInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  deleteButton: {
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  viewOnlyButton: {
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  viewOnlyButtonText: {
    color: '#666',
  },
}); 