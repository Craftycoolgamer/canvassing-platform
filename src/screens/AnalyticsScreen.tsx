import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Business, Company } from '../types';

interface AnalyticsData {
  totalBusinesses: number;
  businessesByStatus: {
    pending: number;
    contacted: number;
    completed: number;
    'not-interested': number;
  };
  businessesByCompany: { [key: string]: number };
  recentActivity: Business[];
}

export const AnalyticsScreen: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const { user } = useAuth();

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Load businesses and companies
      const [businessesResponse, companiesResponse] = await Promise.all([
        apiService.getBusinesses(),
        apiService.getCompanies()
      ]);

      if (businessesResponse.success && companiesResponse.success) {
        const businesses = businessesResponse.data || [];
        const companiesData = companiesResponse.data || [];
        setCompanies(companiesData);

        // Filter businesses by user's company if not admin
        const filteredBusinesses = user?.role === 'Admin' 
          ? businesses 
          : businesses.filter(b => b.companyId === user?.companyId);

        // Calculate analytics
        const businessesByStatus = {
          pending: filteredBusinesses.filter(b => b.status === 'pending').length,
          contacted: filteredBusinesses.filter(b => b.status === 'contacted').length,
          completed: filteredBusinesses.filter(b => b.status === 'completed').length,
          'not-interested': filteredBusinesses.filter(b => b.status === 'not-interested').length,
        };

        const businessesByCompany: { [key: string]: number } = {};
        if (user?.role === 'Admin') {
          companiesData.forEach(company => {
            businessesByCompany[company.name] = businesses.filter(b => b.companyId === company.id).length;
          });
        }

        // Get recent activity (last 10 businesses)
        const recentActivity = filteredBusinesses
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10);

        setAnalyticsData({
          totalBusinesses: filteredBusinesses.length,
          businessesByStatus,
          businessesByCompany,
          recentActivity,
        });
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [user, selectedTimeframe]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'contacted': return '#007AFF';
      case 'completed': return '#34C759';
      case 'not-interested': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'schedule';
      case 'contacted': return 'phone';
      case 'completed': return 'check-circle';
      case 'not-interested': return 'cancel';
      default: return 'help';
    }
  };

  const toggleActivityExpansion = (businessId: string) => {
    setExpandedActivity(expandedActivity === businessId ? null : businessId);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics & Reporting</Text>
        {/* <Text style={styles.subtitle}>Advanced insights and data analysis</Text> */}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timeframe Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Period</Text>
          <View style={styles.timeframeSelector}>
            {(['week', 'month', 'quarter'] as const).map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe && styles.timeframeButtonActive
                ]}
                onPress={() => setSelectedTimeframe(timeframe)}
              >
                <Text style={[
                  styles.timeframeButtonText,
                  selectedTimeframe === timeframe && styles.timeframeButtonTextActive
                ]}>
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Overview Stats */}
        {analyticsData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialIcons name="business" size={24} color="#007AFF" />
                <Text style={styles.statNumber}>{analyticsData.totalBusinesses}</Text>
                <Text style={styles.statLabel}>Total Businesses</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons name="check-circle" size={24} color="#34C759" />
                <Text style={styles.statNumber}>{analyticsData.businessesByStatus.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons name="phone" size={24} color="#007AFF" />
                <Text style={styles.statNumber}>{analyticsData.businessesByStatus.contacted}</Text>
                <Text style={styles.statLabel}>Contacted</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialIcons name="schedule" size={24} color="#FF9500" />
                <Text style={styles.statNumber}>{analyticsData.businessesByStatus.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </View>
        )}

        {/* Status Breakdown */}
        {analyticsData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status Breakdown</Text>
            {Object.entries(analyticsData.businessesByStatus).map(([status, count]) => (
              <View key={status} style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <MaterialIcons 
                    name={getStatusIcon(status) as any} 
                    size={20} 
                    color={getStatusColor(status)} 
                  />
                  <Text style={styles.statusLabel}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </Text>
                </View>
                <Text style={styles.statusCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Company Breakdown (Admin Only) */}
        {analyticsData && user?.role === 'Admin' && Object.keys(analyticsData.businessesByCompany).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Company</Text>
            {Object.entries(analyticsData.businessesByCompany).map(([companyName, count]) => (
              <View key={companyName} style={styles.companyRow}>
                <Text style={styles.companyName}>{companyName}</Text>
                <Text style={styles.companyCount}>{count} businesses</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Activity */}
        {analyticsData && analyticsData.recentActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {analyticsData.recentActivity.map((business) => {
              const company = companies.find(c => c.id === business.companyId);
              const activityDate = new Date(business.updatedAt).toLocaleString();
              const isExpanded = expandedActivity === business.id;
              
              return (
                <View key={business.id} style={styles.activityContainer}>
                  <TouchableOpacity 
                    style={styles.activityRow}
                    onPress={() => toggleActivityExpansion(business.id)}
                  >
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityBusiness}>{business.name}</Text>
                      <Text style={styles.activityStatus}>
                        Status: {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.activityActions}>
                      <View style={[
                        styles.statusIndicator,
                        { backgroundColor: getStatusColor(business.status) }
                      ]} />
                      <MaterialIcons 
                        name={isExpanded ? "expand-less" : "expand-more"} 
                        size={20} 
                        color="#8E8E93" 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {user?.role === 'Admin' && (
                        <Text style={styles.expandedText}>
                          Company: {company?.name || 'Unknown Company'}
                        </Text>
                      )}
                      <Text style={styles.expandedText}>
                        Activity Date: {activityDate}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    height: 80,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    marginBottom: 16,
  },
  timeframeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeframeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  timeframeButtonTextActive: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  statusCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  companyName: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  companyCount: {
    fontSize: 14,
    color: '#666',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityInfo: {
    flex: 1,
  },
  activityBusiness: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  activityStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  activityContainer: {
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  expandedContent: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  expandedText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
}); 