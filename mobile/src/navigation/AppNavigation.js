/**
 * Navigation principale de L1tello Mobile.
 *
 * Structure :
 *  - AuthStack (non connecté) : Login, Register
 *  - AppStack (connecté) : Dashboard, Lecon, Quiz, Profil
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { COLORS, FONTS } from '../constants/theme';

// ── Écrans Auth ──
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// ── Écrans Principaux ──
import DashboardScreen from '../screens/main/DashboardScreen';
import LeconScreen from '../screens/main/LeconScreen';
import QuizScreen from '../screens/main/QuizScreen';
import ProfilScreen from '../screens/main/ProfilScreen';
import UploadLeconScreen from '../screens/main/UploadLeconScreen';

const Stack = createNativeStackNavigator();

// ── Options de style communes ──
const screenOptions = {
  headerStyle: {
    backgroundColor: COLORS.bgPrimary,
  },
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: {
    fontWeight: FONTS.weights.bold,
    fontSize: FONTS.sizes.lg,
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: COLORS.bgPrimary,
  },
};

// ── Stack non connecté ──
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ── Stack connecté ──
function AppStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: '🎓 L1tello' }}
      />
      <Stack.Screen
        name="Lecon"
        component={LeconScreen}
        options={{ title: '📖 Leçon' }}
      />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{ title: '🧠 Quiz' }}
      />
      <Stack.Screen
        name="UploadLecon"
        component={UploadLeconScreen}
        options={{ title: '📤 Ajouter une leçon' }}
      />
      <Stack.Screen
        name="Profil"
        component={ProfilScreen}
        options={{ title: '👤 Profil' }}
      />
    </Stack.Navigator>
  );
}

// ── Navigation Root ──
export default function AppNavigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bgPrimary,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
