import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Business, Company } from '../types';

interface MapProps {
  businesses: Business[];
  companies: Company[];
  onMarkerPress: (business: Business) => void;
  onMapTap?: (latitude: number, longitude: number) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  onMapCenterChange?: (latitude: number, longitude: number) => void;
}

const { width, height } = Dimensions.get('window');

export const Map = forwardRef<any, MapProps>(({
  businesses,
  companies,
  onMarkerPress,
  onMapTap,
  userLocation,
  onMapCenterChange,
}, ref) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const hasInitialized = useRef(false);
  const [mapHtml, setMapHtml] = useState<string>('');
  const [mapReady, setMapReady] = useState(false);

  // Expose zoomToLocation method to parent component
  useImperativeHandle(ref, () => ({
    zoomToLocation: (latitude: number, longitude: number) => {
      const zoomScript = `
        map.setView([${latitude}, ${longitude}], 16);
      `;
      webViewRef.current?.injectJavaScript(zoomScript);
    }
  }));

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  // Create initial map HTML only once
  useEffect(() => {
    if (!hasInitialized.current) {
      setMapHtml(createMapHTML());
      hasInitialized.current = true;
    }
  }, []);

  // Update markers when businesses change (but don't recreate the map)
  useEffect(() => {
    if (hasInitialized.current && webViewRef.current && mapReady) {
      // Add a small delay to ensure WebView is ready
      setTimeout(() => {
        updateMarkers();
      }, 100);
    }
  }, [businesses, companies, mapReady]); // Also depend on companies to update when company colors change

  const getCompanyForBusiness = (business: Business): Company | undefined => {
    return companies.find(company => company.id === business.companyId);
  };

  // Get color based on business status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'contacted':
        return '#007AFF'; // Blue
      case 'completed':
        return '#34C759'; // Green
      case 'not-interested':
        return '#FF3B30'; // Red
      case 'pending':
      default:
        return '#FFA500'; // Orange
    }
  };

  // Create HTML for OpenStreetMap with clustered markers
  const createMapHTML = () => {
    // Use user location only on first load, otherwise use default coordinates
    const centerLat = !hasInitialized.current && location?.coords.latitude ? location.coords.latitude : 37.7749;
    const centerLng = !hasInitialized.current && location?.coords.longitude ? location.coords.longitude : -122.4194;
    
    // Mark as initialized after first load
    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }
    
    const markers = businesses.map((business, index) => {
      const statusColor = getStatusColor(business.status);
      
      return `
        const marker${index} = L.marker([${business.latitude}, ${business.longitude}], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: ${statusColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        });
        
        // Store status data with the marker
        marker${index}.status = '${business.status}';
        
        marker${index}.on('click', function() {
          // Zoom to the marker
          map.setView([${business.latitude}, ${business.longitude}], 16);
          
          // Send marker data to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerClick',
            businessId: '${business.id}',
            latitude: ${business.latitude},
            longitude: ${business.longitude}
          }));
        });
        
        // Add to cluster group
        markers.addLayer(marker${index});
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
            .custom-marker {
              background: transparent;
              border: none;
            }
            .marker-cluster-small {
              background-color: rgba(0, 122, 255, 0.6);
            }
            .marker-cluster-small div {
              background-color: rgba(0, 122, 255, 0.8);
            }
            .marker-cluster-medium {
              background-color: rgba(255, 165, 0, 0.6);
            }
            .marker-cluster-medium div {
              background-color: rgba(255, 165, 0, 0.8);
            }
            .marker-cluster-large {
              background-color: rgba(255, 59, 48, 0.6);
            }
            .marker-cluster-large div {
              background-color: rgba(255, 59, 48, 0.8);
            }
            .marker-cluster-pending {
              background-color: rgba(255, 165, 0, 0.6);
            }
            .marker-cluster-pending div {
              background-color: rgba(255, 165, 0, 0.8);
            }
            .marker-cluster-contacted {
              background-color: rgba(0, 122, 255, 0.6);
            }
            .marker-cluster-contacted div {
              background-color: rgba(0, 122, 255, 0.8);
            }
            .marker-cluster-completed {
              background-color: rgba(52, 199, 89, 0.6);
            }
            .marker-cluster-completed div {
              background-color: rgba(52, 199, 89, 0.8);
            }
            .marker-cluster-not-interested {
              background-color: rgba(255, 59, 48, 0.6);
            }
            .marker-cluster-not-interested div {
              background-color: rgba(255, 59, 48, 0.8);
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap'
            }).addTo(map);
            
            // Create marker cluster group
            const markers = L.markerClusterGroup({
              chunkedLoading: true,
              maxClusterRadius: 50,
              spiderfyOnMaxZoom: true,
              showCoverageOnHover: true,
              zoomToBoundsOnClick: true,
              iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                const markers = cluster.getAllChildMarkers();
                
                // Count statuses in this cluster
                const statusCounts = {};
                markers.forEach(function(marker) {
                  // Extract status from marker's HTML (we'll need to store this data)
                  const status = marker.status || 'pending'; // Default fallback
                  statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                
                // Find the most common status
                let mostCommonStatus = 'pending';
                let maxCount = 0;
                for (const status in statusCounts) {
                  if (statusCounts[status] > maxCount) {
                    maxCount = statusCounts[status];
                    mostCommonStatus = status;
                  }
                }
                
                // Determine cluster size class
                let sizeClass = 'small';
                if (count > 10) {
                  sizeClass = 'large';
                } else if (count > 3) {
                  sizeClass = 'medium';
                }
                
                // Use status-based color class
                const colorClass = 'marker-cluster-' + mostCommonStatus.replace('-', '-');
                
                return L.divIcon({
                  html: '<div><span>' + count + '</span></div>',
                  className: 'marker-cluster marker-cluster-' + sizeClass + ' ' + colorClass,
                  iconSize: L.point(40, 40)
                });
              }
            });
            
            map.addLayer(markers);
            
            ${markers}

            // Add click event listener for map taps
            map.on('click', function(e) {
              const lat = e.latlng.lat;
              const lng = e.latlng.lng;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapTap',
                latitude: lat,
                longitude: lng
              }));
            });

            // Track map center changes
            map.on('moveend', function() {
              const center = map.getCenter();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapCenterChange',
                latitude: center.lat,
                longitude: center.lng
              }));
            });

            // Signal that map is ready
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapReady'
            }));
          </script>
        </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapTap' && onMapTap) {
        onMapTap(data.latitude, data.longitude);
      } else if (data.type === 'markerClick') {
        // Find the business by ID and call onMarkerPress
        const business = businesses.find(b => b.id === data.businessId);
        if (business) {
          onMarkerPress(business);
        }
      } else if (data.type === 'mapCenterChange' && onMapCenterChange) {
        onMapCenterChange(data.latitude, data.longitude);
      } else if (data.type === 'mapReady') {
        console.log('Map JavaScript is ready');
        setMapReady(true);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Function to update markers without recreating the map
  const updateMarkers = () => {
    console.log('Updating markers for', businesses.length, 'businesses');
    
    const markers = businesses.map((business, index) => {
      const statusColor = getStatusColor(business.status);
      return `
        const marker${index} = L.marker([${business.latitude}, ${business.longitude}], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: ${statusColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        });
        
        marker${index}.status = '${business.status}';
        
        marker${index}.on('click', function() {
          map.setView([${business.latitude}, ${business.longitude}], 16);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerClick',
            businessId: '${business.id}',
            latitude: ${business.latitude},
            longitude: ${business.longitude}
          }));
        });
        
        markers.addLayer(marker${index});
      `;
    }).join('');

    const updateScript = `
      try {
        // Clear existing markers
        if (typeof markers !== 'undefined') {
          markers.clearLayers();
          
          // Add new markers
          ${markers}
          console.log('Markers updated successfully');
        } else {
          console.log('Markers object not ready yet');
        }
      } catch (error) {
        console.log('Error updating markers:', error);
      }
    `;
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(updateScript);
    } else {
      console.log('WebView ref not ready');
    }
  };

  // Function to zoom to a specific location
  const zoomToLocation = (latitude: number, longitude: number) => {
    const zoomScript = `
      map.setView([${latitude}, ${longitude}], 16);
    `;
    webViewRef.current?.injectJavaScript(zoomScript);
  };

  // If no businesses, show a message
  if (businesses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyMap}>
          <Text style={styles.emptyTitle}>No Businesses Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap on the map to add your first business
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onMessage={handleWebViewMessage}
        onLoad={() => {
          console.log('Map WebView loaded');
          setMapReady(true);
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  map: {
    flex: 1,
  },
  emptyMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
}); 