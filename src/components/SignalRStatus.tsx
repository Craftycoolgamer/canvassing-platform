import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import signalRService from '../services/signalRService';

const SignalRStatus: React.FC = () => {
  const [connectionState, setConnectionState] = useState<string>('Disconnected');
  const [lastError, setLastError] = useState<string>('');

  useEffect(() => {
    const updateConnectionState = () => {
      const state = signalRService.getConnectionState();
      setConnectionState(state);
      
      // Clear error if connected
      if (state === 'Connected') {
        setLastError('');
      }
    };

    // Update immediately
    updateConnectionState();

    // Set up listeners for connection state changes
    const unsubscribeReconnecting = signalRService.on('reconnecting', () => {
      setConnectionState('Reconnecting...');
      setLastError('Connection lost, attempting to reconnect...');
    });

    const unsubscribeReconnected = signalRService.on('reconnected', () => {
      setConnectionState('Connected');
      setLastError('');
    });

    const unsubscribeDisconnected = signalRService.on('disconnected', () => {
      setConnectionState('Disconnected');
      setLastError('Connection failed, retrying in background...');
    });

    // Poll for connection state changes
    const interval = setInterval(updateConnectionState, 1000);

    return () => {
      unsubscribeReconnecting();
      unsubscribeReconnected();
      unsubscribeDisconnected();
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionState) {
      case 'Connected':
        return '#4CAF50';
      case 'Reconnecting...':
        return '#FF9800';
      case 'Disconnected':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{connectionState}</Text>
      </View>
      {lastError && (
        <Text style={styles.errorText}>{lastError}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    padding: 4,
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 10,
    color: '#F44336',
    marginTop: 2,
    textAlign: 'right',
    fontStyle: 'italic',
  },
});

export default SignalRStatus; 