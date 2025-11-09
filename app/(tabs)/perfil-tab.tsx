import { Stack } from 'expo-router';
import { LogOut, Mail, User as UserIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '@/contexts/userContext';

function LoginFormInTab() {
  const { login, isLoggingIn } = useUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      console.log('[LoginFormInTab] Intentando login...');
      await login({ username: username.trim(), password: password.trim() });
      console.log('[LoginFormInTab] Login exitoso');
    } catch (error: any) {
      console.error('[LoginFormInTab] Error en login:', error);
      Alert.alert('Error', error.message || 'Usuario o contraseña incorrectos');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.loginFormContainer, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.loginScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <UserIcon size={64} color="#8B0000" strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Perfil de Usuario</Text>
          <Text style={styles.subtitle}>
            Inicia sesión para acceder a tu perfil y disfrutar de todas las funciones
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email o usuario</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Email o usuario"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoggingIn}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoggingIn}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

export default function PerfilTabScreen() {
  const { user, isAuthenticated, isLoading, logout } = useUser();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          console.log('[PerfilTab] Usuario confirmó logout');
          await logout();
        },
      },
    ]);
  };

  console.log('[PerfilTab] Estado: isLoading=', isLoading, 'isAuthenticated=', isAuthenticated);

  if (isLoading) {
    console.log('[PerfilTab] Mostrando spinner de carga');
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#8B0000" />
        </View>
      </>
    );
  }

  if (!isAuthenticated) {
    console.log('[PerfilTab] Usuario no autenticado, mostrando formulario de login');
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoginFormInTab />
      </>
    );
  }

  console.log('[PerfilTab] Usuario autenticado, mostrando perfil');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.outerContainer, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 40 }]}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <UserIcon size={48} color="#8B0000" strokeWidth={1.5} />
            </View>
            <Text style={styles.name}>{user?.display_name || 'Usuario'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de la cuenta</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <UserIcon size={20} color="#666" strokeWidth={1.5} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nombre</Text>
                  <Text style={styles.infoValue}>
                    {user?.display_name || 'No especificado'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Mail size={20} color="#666" strokeWidth={1.5} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#FFF" strokeWidth={1.5} />
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Los Pueblos Más Bonitos de España</Text>
            <Text style={styles.footerVersion}>Versión 2.8</Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loginFormContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loginScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  outerContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
  },
  contentContainer: {},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#8B0000',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  header: {
    backgroundColor: '#FFF',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#8B0000',
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#666',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500' as const,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  logoutButton: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  footerVersion: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
});
