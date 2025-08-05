import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Business, Company } from '../types';
import { getStatusColor, getStatusText, formatDate } from '../utils';

interface BusinessCardProps {
  business: Business;
  company: Company;
  onPress: () => void;
  onAssign?: () => void;
  showAssignButton?: boolean;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  company,
  onPress,
  onAssign,
  showAssignButton = false,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{business.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(business.status) }]}>
            <Text style={styles.statusText}>{getStatusText(business.status)}</Text>
          </View>
        </View>
        <View style={[styles.companyBadge, { backgroundColor: company.color }]}>
          <MaterialIcons name={company.pinIcon as any} size={16} color="white" />
          <Text style={styles.companyText}>{company.name}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.detailText} numberOfLines={2}>
            {business.address}
          </Text>
        </View>

        {business.phone && (
          <View style={styles.detailRow}>
            <MaterialIcons name="phone" size={16} color="#666" />
            <Text style={styles.detailText}>{business.phone}</Text>
          </View>
        )}

        {business.email && (
          <View style={styles.detailRow}>
            <MaterialIcons name="email" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {business.email}
            </Text>
          </View>
        )}

        {business.website && (
          <View style={styles.detailRow}>
            <MaterialIcons name="language" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {business.website}
            </Text>
          </View>
        )}

        {business.notes && business.notes.length > 0 && (
          <View style={styles.detailRow}>
            <MaterialIcons name="note" size={16} color="#666" />
            <View style={styles.notesContainer}>
              {business.notes.map((note, index) => (
                <Text key={index} style={styles.noteText} numberOfLines={2}>
                  {note}
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>
              Added: {formatDate(business.createdAt)}
            </Text>
            {business.lastContactDate && (
              <Text style={styles.dateText}>
                Last Contact: {formatDate(business.lastContactDate)}
              </Text>
            )}
          </View>
          
          {showAssignButton && onAssign && (
            <TouchableOpacity
              style={styles.assignButton}
              onPress={(e) => {
                e.stopPropagation();
                onAssign();
              }}
            >
              <MaterialIcons name="person-add" size={16} color="#007AFF" />
              <Text style={styles.assignButtonText}>
                {business.assignedUserId ? 'Reassign' : 'Assign'}
              </Text>
            </TouchableOpacity>
          )}
          

        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  companyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  assignButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },

  notesContainer: {
    flex: 1,
    marginLeft: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
}); 