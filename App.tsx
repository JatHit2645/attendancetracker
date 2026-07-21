import 'react-native-gesture-handler';
import { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, AppState, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { canvas, accent } from './src/theme/colors';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Main App (Post-authentication)
import MainAppShell from './src/screens/main/MainAppShell';
import LockScreen from './src/screens/auth/LockScreen';
import { SyncService } from './src/services/SyncService';
import { supabase } from './src/lib/supabase';
import { NotificationService } from './src/services/NotificationService';

// Keep the splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

type AuthScreen = 'login' | 'register' | 'forgotPassword';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
  });

  // Auth navigation state
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  // Web is always unlocked (no mobile fingerprint on web). Mobile starts locked on cold app open if already authenticated.
  const [isUnlocked, setIsUnlocked] = useState<boolean>(Platform.OS === 'web');

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (event === 'SIGNED_IN') {
        // Just logged in or registered — auto-unlock directly to Dashboard!
        setIsUnlocked(true);
      } else if (event === 'SIGNED_OUT') {
        setIsUnlocked(Platform.OS === 'web');
      }
    });

    // Setup Notifications
    NotificationService.requestPermissions().then((granted) => {
      if (granted) {
        NotificationService.scheduleDailyLogReminder();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Handle app state changes for offline sync
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App has come to the foreground!
        console.log('App active - flushing sync queue');
        SyncService.flushQueue();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Show loading indicator while fonts are loading or auth is initializing
  if (!fontsLoaded && !fontError || isAuthenticated === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={accent.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  // Render the appropriate screen
  const renderContent = () => {
    // Authenticated — handle lock screen or main app
    if (isAuthenticated) {
      if (!isUnlocked) {
        return (
          <LockScreen 
            onUnlock={() => setIsUnlocked(true)} 
            onLogout={() => supabase.auth.signOut()} 
          />
        );
      }
      return <MainAppShell />;
    }

    // Not authenticated — show auth screens
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onNavigateToRegister={() => setCurrentScreen('register')}
            onNavigateToForgotPassword={() => setCurrentScreen('forgotPassword')}
            onLoginSuccess={() => setIsAuthenticated(true)}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onNavigateToLogin={() => setCurrentScreen('login')}
            onRegisterSuccess={() => setCurrentScreen('login')}
          />
        );
      case 'forgotPassword':
        return (
          <ForgotPasswordScreen
            onNavigateToLogin={() => setCurrentScreen('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} onLayout={onLayoutRootView}>
          {renderContent()}
          <StatusBar style="light" />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: canvas.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: canvas.base,
  },
});
