import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useUserInfo } from '@/hooks/useUserInfo';

export function UserProfile() {
  const { data: userInfo, isLoading, error } = useUserInfo();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading user info...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading user info</Text>
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.noUserText}>No user logged in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <Text style={styles.infoText}>
        Name: {userInfo.firstName} {userInfo.lastName}
      </Text>
      <Text style={styles.infoText}>Email: {userInfo.email}</Text>
      {userInfo.phone && (
        <Text style={styles.infoText}>Phone: {userInfo.phone}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF5722',
  },
  noUserText: {
    fontSize: 14,
    color: '#999',
  },
});

