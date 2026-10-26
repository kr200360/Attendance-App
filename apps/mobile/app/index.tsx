import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileAuth } from '../src/context';

export default function Index() {
  const router = useRouter();
  const { user } = useMobileAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    } else if (user.role === 'teacher' || user.role === 'admin') {
      router.replace('/(teacher)');
    } else if (user.role === 'parent') {
      router.replace('/(parent)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  }
});
