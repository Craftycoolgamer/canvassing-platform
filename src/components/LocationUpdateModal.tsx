import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Business, Company } from '../types';
import { Map } from './Map';
import { useDataManager } from '../hooks/useDataManager';

const { width, height } = Dimensions.get('window');

interface LocationUpdateModalProps {
  business: Business;
  companies: Company[];
  onClose: () => void;
  onLocationUpdate: (updatedBusiness: Business) => void;
  initialPosition?: { latitude: number; longitude: number };
}

export const LocationUpdateModal: React.FC<LocationUpdateModalProps> = ({
  business,
  companies,
  onClose,
  onLocationUpdate,
  initialPosition,
}) => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: initialPosition?.latitude ?? business.latitude,
    longitude: initialPosition?.longitude ?? business.longitude,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const mapRef = useRef<any>(null);

  // Use the centralized data manager
  const {
    updateBusiness,
  } = useDataManager();

  const company = companies.find(c => c.id === business.companyId);

  // Get user location when component mounts (only as fallback)
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation(location);
          
          // For new businesses without initialPosition, start with user location
          if (business.id === 'temp' && !initialPosition && (business.latitude === 0 || business.longitude === 0)) {
            setCurrentLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getUserLocation();
  }, [business.id, business.latitude, business.longitude, initialPosition]);

  const handleMapCenterChange = (latitude: number, longitude: number) => {
    setCurrentLocation({ latitude, longitude });
  };

  const handleUpdateLocation = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      // Create updated business object with all existing data plus new coordinates
      const updatedBusiness = {
        ...business,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };

      // If this is a new business (temp id), don't save to database yet
      if (business.id === 'temp') {
        onLocationUpdate(updatedBusiness);
        return;
      }

      // For existing businesses, update in database
      await updateBusiness(business.id, updatedBusiness);

      Alert.alert(
        'Success',
        'Business location updated successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              onLocationUpdate(updatedBusiness);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!company) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Update Location</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Company not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {business.id === 'temp' ? 'Set Location' : 'Update Location'}
        </Text>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Business Info */}
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{business.name}</Text>
        <Text style={styles.businessAddress}>{business.address}</Text>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <Map
          ref={mapRef}
          businesses={[business]}
          companies={[company]}
          onMarkerPress={() => {}}
          onMapCenterChange={handleMapCenterChange}
          initialCenter={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
        />
        
        {/* Center Icon */}
        <View style={styles.centerIcon}>
          <MaterialIcons name="location-on" size={32} color="#007AFF" />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          {business.id === 'temp' 
            ? 'Move the map to set the location for your new business'
            : 'Move the map to position the pin at the correct location'
          }
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.updateButton, isUpdating && styles.disabledButton]}
          onPress={handleUpdateLocation}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Text style={styles.updateButtonText}>Updating...</Text>
          ) : (
            <Text style={styles.updateButtonText}>
              {business.id === 'temp' ? 'Set Location' : 'Update Location'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  businessInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  centerIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
    zIndex: 1000,
  },
  instructions: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#007AFF',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
}); 