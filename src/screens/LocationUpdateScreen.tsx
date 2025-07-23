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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Business, Company } from '../types';
import { apiService } from '../services/api';
import { Map } from '../components/Map';

const { width, height } = Dimensions.get('window');

interface LocationUpdateScreenProps {
  business: Business;
  company: Company;
}

export const LocationUpdateScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { business, company } = route.params as LocationUpdateScreenProps;
  
  const [currentLocation, setCurrentLocation] = useState({
    latitude: business.latitude,
    longitude: business.longitude,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const mapRef = useRef<any>(null);

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

      const response = await apiService.updateBusiness(business.id, updatedBusiness);

      if (response.success) {
        Alert.alert(
          'Success',
          'Business location updated successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Update Location</Text>
        <View style={styles.placeholder} />
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
            latitude: business.latitude,
            longitude: business.longitude,
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
          Move the map to position the pin at the correct location
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
            <Text style={styles.updateButtonText}>Update Location</Text>
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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
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