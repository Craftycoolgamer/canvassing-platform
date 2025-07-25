import React, { useState, useEffect, useCallback } from 'react';
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
import { Business, Company, User } from '../types';
import { useDataManager } from '../hooks/useDataManager';

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
  // New analytics
  performanceMetrics: {
    conversionRate: number;
    averageResponseTime: number;
    completionRate: number;
    rejectionRate: number;
  };
  trends: {
    weeklyGrowth: number;
    monthlyGrowth: number;
    statusChanges: { [key: string]: number };
  };
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    userPerformance: { [key: string]: number };
  };
  geographicData: {
    totalLocations: number;
    averageDistance: number;
    coverageArea: number;
  };
  timeBasedAnalytics: {
    hourlyActivity: { [key: string]: number };
    dailyActivity: { [key: string]: number };
    weeklyActivity: { [key: string]: number };
  };
}

interface UserAnalytics {
  user: User;
  assignedBusinesses: Business[];
  businessesByStatus: {
    pending: number;
    contacted: number;
    completed: number;
    'not-interested': number;
  };
  performanceMetrics: {
    conversionRate: number;
    averageResponseTime: number;
    completionRate: number;
    rejectionRate: number;
  };
  recentActivity: Business[];
  geographicData: {
    totalLocations: number;
    averageDistance: number;
    coverageArea: number;
  };
  timeBasedAnalytics: {
    hourlyActivity: { [key: string]: number };
    dailyActivity: { [key: string]: number };
    weeklyActivity: { [key: string]: number };
  };
}

export const AnalyticsScreen: React.FC = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'performance' | 'trends' | 'users' | 'geographic'>('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Use the centralized data manager
  const {
    businesses,
    companies,
    users,
    syncAllData,
  } = useDataManager();

  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ensure data is synced
      await syncAllData();
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert('Error', 'Failed to sync data');
    } finally {
      setIsLoading(false);
    }
  }, [syncAllData]);

  // Calculate analytics from current data
  const calculateAnalytics = useCallback(() => {
    if (businesses.length === 0 && companies.length === 0) return;

    // Filter businesses by user's company if not admin
    const filteredBusinesses = user?.role === 'Admin' 
      ? businesses 
      : businesses.filter(b => b.companyId === user?.companyId);

    // Calculate basic analytics
    const businessesByStatus = {
      pending: filteredBusinesses.filter(b => b.status === 'pending').length,
      contacted: filteredBusinesses.filter(b => b.status === 'contacted').length,
      completed: filteredBusinesses.filter(b => b.status === 'completed').length,
      'not-interested': filteredBusinesses.filter(b => b.status === 'not-interested').length,
    };

    const businessesByCompany: { [key: string]: number } = {};
    if (user?.role === 'Admin') {
      companies.forEach(company => {
        businessesByCompany[company.name] = businesses.filter(b => b.companyId === company.id).length;
      });
    }

    // Get recent activity (last 10 businesses)
    const recentActivity = filteredBusinesses
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);

    // Calculate performance metrics
    const totalBusinesses = filteredBusinesses.length;
    const completedBusinesses = businessesByStatus.completed;
    const contactedBusinesses = businessesByStatus.contacted;
    const notInterestedBusinesses = businessesByStatus['not-interested'];

    const performanceMetrics = {
      conversionRate: totalBusinesses > 0 ? (completedBusinesses / totalBusinesses) * 100 : 0,
      averageResponseTime: calculateAverageResponseTime(filteredBusinesses),
      completionRate: totalBusinesses > 0 ? (completedBusinesses / totalBusinesses) * 100 : 0,
      rejectionRate: totalBusinesses > 0 ? (notInterestedBusinesses / totalBusinesses) * 100 : 0,
    };

    // Calculate trends
    const trends = calculateTrends(filteredBusinesses);

    // Calculate user activity
    const userActivity = calculateUserActivity(users, businesses, user);

    // Calculate geographic data
    const geographicData = calculateGeographicData(filteredBusinesses);

    // Calculate time-based analytics
    const timeBasedAnalytics = calculateTimeBasedAnalytics(filteredBusinesses);

    setAnalyticsData({
      totalBusinesses: filteredBusinesses.length,
      businessesByStatus,
      businessesByCompany,
      recentActivity,
      performanceMetrics,
      trends,
      userActivity,
      geographicData,
      timeBasedAnalytics,
    });
  }, [user, businesses, companies, users]);

  // Helper functions for calculations
  const calculateAverageResponseTime = (businesses: Business[]): number => {
    const businessesWithContact = businesses.filter(b => b.lastContactDate);
    if (businessesWithContact.length === 0) return 0;

    const totalTime = businessesWithContact.reduce((sum, business) => {
      const createdAt = new Date(business.createdAt).getTime();
      const contactDate = new Date(business.lastContactDate!).getTime();
      return sum + (contactDate - createdAt);
    }, 0);

    return Math.round(totalTime / businessesWithContact.length / (1000 * 60 * 60 * 24)); // Days
  };

  const calculateTrends = (businesses: Business[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentBusinesses = businesses.filter(b => new Date(b.createdAt) >= weekAgo);
    const olderBusinesses = businesses.filter(b => {
      const date = new Date(b.createdAt);
      return date >= monthAgo && date < weekAgo;
    });

    const statusChanges = businesses.reduce((acc, business) => {
      const status = business.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      weeklyGrowth: recentBusinesses.length,
      monthlyGrowth: olderBusinesses.length,
      statusChanges,
    };
  };

  const calculateUserActivity = (users: User[], businesses: Business[], currentUser: User | null) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive && u.isApproved).length;

    const userPerformance: { [key: string]: number } = {};
    if (currentUser?.role === 'Admin') {
      users.forEach(user => {
        const userBusinesses = businesses.filter(b => b.assignedUserId === user.id);
        userPerformance[user.firstName + ' ' + user.lastName] = userBusinesses.length;
      });
    }

    return {
      totalUsers,
      activeUsers,
      userPerformance,
    };
  };

  const calculateGeographicData = (businesses: Business[]) => {
    const totalLocations = businesses.length;
    
    // Calculate average distance (simplified - using coordinates)
    let totalDistance = 0;
    let distanceCount = 0;
    
    for (let i = 0; i < businesses.length; i++) {
      for (let j = i + 1; j < businesses.length; j++) {
        const distance = calculateDistance(
          businesses[i].latitude, businesses[i].longitude,
          businesses[j].latitude, businesses[j].longitude
        );
        totalDistance += distance;
        distanceCount++;
      }
    }

    const averageDistance = distanceCount > 0 ? totalDistance / distanceCount : 0;
    const coverageArea = totalLocations * averageDistance; // Simplified coverage calculation

    return {
      totalLocations,
      averageDistance: Math.round(averageDistance * 100) / 100,
      coverageArea: Math.round(coverageArea * 100) / 100,
    };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateTimeBasedAnalytics = (businesses: Business[]) => {
    const hourlyActivity: { [key: string]: number } = {};
    const dailyActivity: { [key: string]: number } = {};
    const weeklyActivity: { [key: string]: number } = {};

    businesses.forEach(business => {
      const date = new Date(business.updatedAt);
      const hour = date.getHours();
      const day = date.getDay();
      const week = Math.floor(date.getDate() / 7);

      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
      weeklyActivity[week] = (weeklyActivity[week] || 0) + 1;
    });

    return {
      hourlyActivity,
      dailyActivity,
      weeklyActivity,
    };
  };

  const calculateUserAnalytics = (selectedUser: User): UserAnalytics => {
    const assignedBusinesses = businesses.filter(b => b.assignedUserId === selectedUser.id);
    
    const businessesByStatus = {
      pending: assignedBusinesses.filter(b => b.status === 'pending').length,
      contacted: assignedBusinesses.filter(b => b.status === 'contacted').length,
      completed: assignedBusinesses.filter(b => b.status === 'completed').length,
      'not-interested': assignedBusinesses.filter(b => b.status === 'not-interested').length,
    };

    const totalBusinesses = assignedBusinesses.length;
    const completedBusinesses = businessesByStatus.completed;
    const notInterestedBusinesses = businessesByStatus['not-interested'];

    const performanceMetrics = {
      conversionRate: totalBusinesses > 0 ? (completedBusinesses / totalBusinesses) * 100 : 0,
      averageResponseTime: calculateAverageResponseTime(assignedBusinesses),
      completionRate: totalBusinesses > 0 ? (completedBusinesses / totalBusinesses) * 100 : 0,
      rejectionRate: totalBusinesses > 0 ? (notInterestedBusinesses / totalBusinesses) * 100 : 0,
    };

    const recentActivity = assignedBusinesses
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    const geographicData = calculateGeographicData(assignedBusinesses);
    const timeBasedAnalytics = calculateTimeBasedAnalytics(assignedBusinesses);

    return {
      user: selectedUser,
      assignedBusinesses,
      businessesByStatus,
      performanceMetrics,
      recentActivity,
      geographicData,
      timeBasedAnalytics,
    };
  };

  // Load data on mount
  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Calculate analytics when data changes
  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

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

  const renderMetricSelector = () => (
    <View style={styles.metricSelector}>
      {[
        { key: 'overview', label: 'Overview', icon: 'dashboard' },
        { key: 'performance', label: 'Performance', icon: 'trending-up' },
        { key: 'trends', label: 'Trends', icon: 'timeline' },
        { key: 'users', label: 'Users', icon: 'people' },
        { key: 'geographic', label: 'Geographic', icon: 'location-on' },
      ].map((metric) => (
        <TouchableOpacity
          key={metric.key}
          style={[
            styles.metricButton,
            selectedMetric === metric.key && styles.metricButtonActive
          ]}
          onPress={() => setSelectedMetric(metric.key as any)}
        >
          <MaterialIcons 
            name={metric.icon as any} 
            size={16} 
            color={selectedMetric === metric.key ? 'white' : '#666'} 
          />
          <Text style={[
            styles.metricButtonText,
            selectedMetric === metric.key && styles.metricButtonTextActive
          ]}>
            {metric.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <>
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
    </>
  );

  const renderPerformance = () => (
    analyticsData && (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <MaterialIcons name="trending-up" size={24} color="#34C759" />
              <Text style={styles.performanceNumber}>{analyticsData.performanceMetrics.conversionRate.toFixed(1)}%</Text>
              <Text style={styles.performanceLabel}>Conversion Rate</Text>
            </View>
            
            <View style={styles.performanceCard}>
              <MaterialIcons name="schedule" size={24} color="#007AFF" />
              <Text style={styles.performanceNumber}>{analyticsData.performanceMetrics.averageResponseTime}</Text>
              <Text style={styles.performanceLabel}>Avg Response (Days)</Text>
            </View>
            
            <View style={styles.performanceCard}>
              <MaterialIcons name="check-circle" size={24} color="#34C759" />
              <Text style={styles.performanceNumber}>{analyticsData.performanceMetrics.completionRate.toFixed(1)}%</Text>
              <Text style={styles.performanceLabel}>Completion Rate</Text>
            </View>
            
            <View style={styles.performanceCard}>
              <MaterialIcons name="cancel" size={24} color="#FF3B30" />
              <Text style={styles.performanceNumber}>{analyticsData.performanceMetrics.rejectionRate.toFixed(1)}%</Text>
              <Text style={styles.performanceLabel}>Rejection Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time-based Activity</Text>
          <View style={styles.timeActivityContainer}>
            <Text style={styles.timeActivityTitle}>Hourly Distribution</Text>
            <View style={styles.timeActivityGrid}>
              {Object.entries(analyticsData.timeBasedAnalytics.hourlyActivity).map(([hour, count]) => (
                <View key={hour} style={styles.timeActivityItem}>
                  <Text style={styles.timeActivityHour}>{hour}:00</Text>
                  <View style={[styles.timeActivityBar, { height: Math.max(count * 3, 10) }]} />
                  <Text style={styles.timeActivityCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </>
    )
  );

  const renderTrends = () => (
    analyticsData && (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Trends</Text>
          <View style={styles.trendsGrid}>
            <View style={styles.trendCard}>
              <MaterialIcons name="trending-up" size={24} color="#34C759" />
              <Text style={styles.trendNumber}>{analyticsData.trends.weeklyGrowth}</Text>
              <Text style={styles.trendLabel}>This Week</Text>
            </View>
            
            <View style={styles.trendCard}>
              <MaterialIcons name="calendar-today" size={24} color="#007AFF" />
              <Text style={styles.trendNumber}>{analyticsData.trends.monthlyGrowth}</Text>
              <Text style={styles.trendLabel}>This Month</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Changes</Text>
          {Object.entries(analyticsData.trends.statusChanges).map(([status, count]) => (
            <View key={status} style={styles.statusChangeRow}>
              <View style={styles.statusChangeInfo}>
                <MaterialIcons 
                  name={getStatusIcon(status) as any} 
                  size={20} 
                  color={getStatusColor(status)} 
                />
                <Text style={styles.statusChangeLabel}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </Text>
              </View>
              <Text style={styles.statusChangeCount}>{count} changes</Text>
            </View>
          ))}
        </View>
      </>
    )
  );

  const renderUsers = () => (
    analyticsData && (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Activity</Text>
          <View style={styles.userStatsGrid}>
            <View style={styles.userStatCard}>
              <MaterialIcons name="people" size={24} color="#007AFF" />
              <Text style={styles.userStatNumber}>{analyticsData.userActivity.totalUsers}</Text>
              <Text style={styles.userStatLabel}>Total Users</Text>
            </View>
            
            <View style={styles.userStatCard}>
              <MaterialIcons name="person" size={24} color="#34C759" />
              <Text style={styles.userStatNumber}>{analyticsData.userActivity.activeUsers}</Text>
              <Text style={styles.userStatLabel}>Active Users</Text>
            </View>
          </View>
        </View>

        {user?.role === 'Admin' && Object.keys(analyticsData.userActivity.userPerformance).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Performance</Text>
            {Object.entries(analyticsData.userActivity.userPerformance)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([userName, count]) => {
                const userObj = users.find(u => `${u.firstName} ${u.lastName}` === userName);
                return (
                  <TouchableOpacity 
                    key={userName} 
                    style={styles.userPerformanceRow}
                    onPress={() => {
                      if (userObj) {
                        setSelectedUser(userObj);
                        setShowUserDetails(true);
                      }
                    }}
                  >
                    <View style={styles.userPerformanceInfo}>
                      <Text style={styles.userPerformanceName}>{userName}</Text>
                      <Text style={styles.userPerformanceCount}>{count} businesses</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#666" />
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
      </>
    )
  );

  const renderGeographic = () => (
    analyticsData && (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geographic Coverage</Text>
          <View style={styles.geographicGrid}>
            <View style={styles.geographicCard}>
              <MaterialIcons name="location-on" size={24} color="#007AFF" />
              <Text style={styles.geographicNumber}>{analyticsData.geographicData.totalLocations}</Text>
              <Text style={styles.geographicLabel}>Total Locations</Text>
            </View>
            
            <View style={styles.geographicCard}>
              <MaterialIcons name="straighten" size={24} color="#34C759" />
              <Text style={styles.geographicNumber}>{analyticsData.geographicData.averageDistance}km</Text>
              <Text style={styles.geographicLabel}>Avg Distance</Text>
            </View>
            
            <View style={styles.geographicCard}>
              <MaterialIcons name="map" size={24} color="#FF9500" />
              <Text style={styles.geographicNumber}>{analyticsData.geographicData.coverageArea}km²</Text>
              <Text style={styles.geographicLabel}>Coverage Area</Text>
            </View>
          </View>
        </View>
      </>
    )
  );

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
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Metric Selector */}
        {renderMetricSelector()}

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

        {/* Render selected metric content */}
        {selectedMetric === 'overview' && renderOverview()}
        {selectedMetric === 'performance' && renderPerformance()}
        {selectedMetric === 'trends' && renderTrends()}
        {selectedMetric === 'users' && renderUsers()}
        {selectedMetric === 'geographic' && renderGeographic()}

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

      {/* User Detail Modal */}
      {showUserDetails && selectedUser && (
        <View style={styles.modalOverlay}>
          <View style={styles.userDetailModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedUser.firstName} {selectedUser.lastName}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowUserDetails(false);
                  setSelectedUser(null);
                }}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {(() => {
                const userAnalytics = calculateUserAnalytics(selectedUser);
                return (
                  <>
                    {/* User Overview */}
                    <View style={styles.userDetailSection}>
                      <Text style={styles.sectionTitle}>Overview</Text>
                      <View style={styles.userOverviewGrid}>
                        <View style={styles.userOverviewCard}>
                          <MaterialIcons name="business" size={24} color="#007AFF" />
                          <Text style={styles.userOverviewNumber}>{userAnalytics.assignedBusinesses.length}</Text>
                          <Text style={styles.userOverviewLabel}>Assigned Businesses</Text>
                        </View>
                        
                        <View style={styles.userOverviewCard}>
                          <MaterialIcons name="check-circle" size={24} color="#34C759" />
                          <Text style={styles.userOverviewNumber}>{userAnalytics.businessesByStatus.completed}</Text>
                          <Text style={styles.userOverviewLabel}>Completed</Text>
                        </View>
                        
                        <View style={styles.userOverviewCard}>
                          <MaterialIcons name="phone" size={24} color="#007AFF" />
                          <Text style={styles.userOverviewNumber}>{userAnalytics.businessesByStatus.contacted}</Text>
                          <Text style={styles.userOverviewLabel}>Contacted</Text>
                        </View>
                        
                        <View style={styles.userOverviewCard}>
                          <MaterialIcons name="schedule" size={24} color="#FF9500" />
                          <Text style={styles.userOverviewNumber}>{userAnalytics.businessesByStatus.pending}</Text>
                          <Text style={styles.userOverviewLabel}>Pending</Text>
                        </View>
                      </View>
                    </View>

                    {/* Performance Metrics */}
                    <View style={styles.userDetailSection}>
                      <Text style={styles.sectionTitle}>Performance</Text>
                      <View style={styles.userPerformanceGrid}>
                        <View style={styles.userPerformanceCard}>
                          <MaterialIcons name="trending-up" size={24} color="#34C759" />
                          <Text style={styles.userPerformanceNumber}>
                            {userAnalytics.performanceMetrics.conversionRate.toFixed(1)}%
                          </Text>
                          <Text style={styles.userPerformanceLabel}>Conversion Rate</Text>
                        </View>
                        
                        <View style={styles.userPerformanceCard}>
                          <MaterialIcons name="schedule" size={24} color="#007AFF" />
                          <Text style={styles.userPerformanceNumber}>
                            {userAnalytics.performanceMetrics.averageResponseTime}
                          </Text>
                          <Text style={styles.userPerformanceLabel}>Avg Response (Days)</Text>
                        </View>
                        
                        <View style={styles.userPerformanceCard}>
                          <MaterialIcons name="check-circle" size={24} color="#34C759" />
                          <Text style={styles.userPerformanceNumber}>
                            {userAnalytics.performanceMetrics.completionRate.toFixed(1)}%
                          </Text>
                          <Text style={styles.userPerformanceLabel}>Completion Rate</Text>
                        </View>
                        
                        <View style={styles.userPerformanceCard}>
                          <MaterialIcons name="cancel" size={24} color="#FF3B30" />
                          <Text style={styles.userPerformanceNumber}>
                            {userAnalytics.performanceMetrics.rejectionRate.toFixed(1)}%
                          </Text>
                          <Text style={styles.userPerformanceLabel}>Rejection Rate</Text>
                        </View>
                      </View>
                    </View>

                    {/* Status Breakdown */}
                    <View style={styles.userDetailSection}>
                      <Text style={styles.sectionTitle}>Status Breakdown</Text>
                      {Object.entries(userAnalytics.businessesByStatus).map(([status, count]) => (
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

                    {/* Recent Activity */}
                    {userAnalytics.recentActivity.length > 0 && (
                      <View style={styles.userDetailSection}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        {userAnalytics.recentActivity.map((business) => {
                          const company = companies.find(c => c.id === business.companyId);
                          const activityDate = new Date(business.updatedAt).toLocaleString();
                          
                          return (
                            <View key={business.id} style={styles.userActivityItem}>
                              <View style={styles.userActivityInfo}>
                                <Text style={styles.userActivityBusiness}>{business.name}</Text>
                                <Text style={styles.userActivityStatus}>
                                  Status: {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                                </Text>
                                <Text style={styles.userActivityDate}>{activityDate}</Text>
                              </View>
                              <View style={[
                                styles.userActivityIndicator,
                                { backgroundColor: getStatusColor(business.status) }
                              ]} />
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Geographic Data */}
                    <View style={styles.userDetailSection}>
                      <Text style={styles.sectionTitle}>Geographic Coverage</Text>
                      <View style={styles.userGeographicGrid}>
                        <View style={styles.userGeographicCard}>
                          <MaterialIcons name="location-on" size={24} color="#007AFF" />
                          <Text style={styles.userGeographicNumber}>{userAnalytics.geographicData.totalLocations}</Text>
                          <Text style={styles.userGeographicLabel}>Locations</Text>
                        </View>
                        
                        <View style={styles.userGeographicCard}>
                          <MaterialIcons name="straighten" size={24} color="#34C759" />
                          <Text style={styles.userGeographicNumber}>{userAnalytics.geographicData.averageDistance}km</Text>
                          <Text style={styles.userGeographicLabel}>Avg Distance</Text>
                        </View>
                        
                        <View style={styles.userGeographicCard}>
                          <MaterialIcons name="map" size={24} color="#FF9500" />
                          <Text style={styles.userGeographicNumber}>{userAnalytics.geographicData.coverageArea}km²</Text>
                          <Text style={styles.userGeographicLabel}>Coverage Area</Text>
                        </View>
                      </View>
                    </View>
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
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
  metricSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  metricButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  metricButtonActive: {
    backgroundColor: '#007AFF',
  },
  metricButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  metricButtonTextActive: {
    color: 'white',
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
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  performanceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  performanceNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  performanceLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  trendsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  trendCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  trendNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  userStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  userStatCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  userStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  userStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  geographicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  geographicCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  geographicNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  geographicLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
  statusChangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusChangeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChangeLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  statusChangeCount: {
    fontSize: 14,
    color: '#666',
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
  userPerformanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userPerformanceInfo: {
    flex: 1,
  },
  userPerformanceName: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  userPerformanceCount: {
    fontSize: 14,
    color: '#666',
  },
  timeActivityContainer: {
    marginTop: 12,
  },
  timeActivityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  timeActivityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  timeActivityItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  timeActivityHour: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  timeActivityBar: {
    width: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    marginBottom: 4,
  },
  timeActivityCount: {
    fontSize: 10,
    color: '#666',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  userDetailModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  userDetailSection: {
    marginBottom: 24,
  },
  userOverviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  userOverviewCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  userOverviewNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  userOverviewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  userPerformanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  userPerformanceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  userPerformanceNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  userPerformanceLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  userActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userActivityInfo: {
    flex: 1,
  },
  userActivityBusiness: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  userActivityStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userActivityDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  userActivityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  userGeographicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  userGeographicCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  userGeographicNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  userGeographicLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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