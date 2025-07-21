import { Business, Company } from '../types';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString();
};

export const getStatusColor = (status: Business['status']): string => {
  switch (status) {
    case 'pending':
      return '#FFA500';
    case 'contacted':
      return '#007AFF';
    case 'completed':
      return '#34C759';
    case 'not-interested':
      return '#FF3B30';
    default:
      return '#8E8E93';
  }
};

export const getStatusText = (status: Business['status']): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'contacted':
      return 'Contacted';
    case 'completed':
      return 'Completed';
    case 'not-interested':
      return 'Not Interested';
    default:
      return 'Unknown';
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateWebsite = (website: string): boolean => {
  if (!website) return true; // Optional field
  const websiteRegex = /^https?:\/\/.+/;
  return websiteRegex.test(website);
};

export const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const sortBusinessesByDistance = (
  businesses: Business[],
  userLat: number,
  userLon: number
): Business[] => {
  return [...businesses].sort((a, b) => {
    const distanceA = getDistance(userLat, userLon, a.latitude, a.longitude);
    const distanceB = getDistance(userLat, userLon, b.latitude, b.longitude);
    return distanceA - distanceB;
  });
};

export const filterBusinessesByStatus = (
  businesses: Business[],
  status: Business['status'] | 'all'
): Business[] => {
  if (status === 'all') return businesses;
  return businesses.filter(business => business.status === status);
};

export const searchBusinesses = (
  businesses: Business[],
  query: string
): Business[] => {
  const lowercaseQuery = query.toLowerCase();
  return businesses.filter(
    business =>
      business.name.toLowerCase().includes(lowercaseQuery) ||
      business.address.toLowerCase().includes(lowercaseQuery) ||
      business.phone.includes(query) ||
      business.email.toLowerCase().includes(lowercaseQuery)
  );
}; 