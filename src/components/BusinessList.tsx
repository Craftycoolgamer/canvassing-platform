import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Business, Company } from '../types';
import { getStatusColor, getStatusText } from '../utils';

interface BusinessListProps {
  businesses: Business[];
  companies: Company[];
  onBusinessPress: (business: Business) => void;
  mapCenter?: { latitude: number; longitude: number };
}

export const BusinessList: React.FC<BusinessListProps> = ({
  businesses,
  companies,
  onBusinessPress,
  mapCenter,
}) => {
  const getCompanyForBusiness = (business: Business): Company | undefined => {
    return companies.find(company => company.id === business.companyId);
  };

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

  // Format distance for display
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  };

  if (businesses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="business" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Businesses Yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your first business to get started
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Businesses</Text>
        {/* <Text style={styles.subtitle}>{businesses.length} businesses in your area</Text> */}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {businesses.map((business) => {
          const company = getCompanyForBusiness(business);
          if (!company) return null;

          // Calculate distance from map center if available
          let distanceText = '';
          if (mapCenter) {
            const distance = calculateDistance(
              mapCenter.latitude,
              mapCenter.longitude,
              business.latitude,
              business.longitude
            );
            distanceText = formatDistance(distance);
          }

          return (
            <TouchableOpacity
              key={business.id}
              style={styles.businessItem}
              onPress={() => onBusinessPress(business)}
            >
              <View style={[styles.businessIcon, { backgroundColor: getStatusColor(business.status) }]}>
                <MaterialIcons name={company.pinIcon as any} size={20} color="white" />
              </View>
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{business.name}</Text>
                <Text style={styles.businessAddress}>{business.address}</Text>
                <View style={styles.businessMeta}>
                  <Text style={styles.businessCompany}>{company.name}</Text>
                  <View style={styles.businessMetaRight}>
                    {distanceText && (
                      <Text style={styles.businessDistance}>{distanceText}</Text>
                    )}
                    <Text style={[styles.businessStatus, { color: getStatusColor(business.status) }]}>
                      {getStatusText(business.status)}
                    </Text>
                  </View>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  header: {
    padding: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  businessIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  businessAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  businessCompany: {
    fontSize: 12,
    color: '#999',
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  businessDistance: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  businessStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
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
}); 