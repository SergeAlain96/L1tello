/**
 * L1tello Mobile — Point d'entrée de l'application.
 *
 * Fournit le contexte d'authentification et la navigation.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigation from './src/navigation/AppNavigation';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNavigation />
    </AuthProvider>
  );
}
