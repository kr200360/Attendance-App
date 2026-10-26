import React from 'react';
import { Stack } from 'expo-router';
import { MobileAuthProvider } from '../src/context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <MobileAuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </MobileAuthProvider>
  );
}
