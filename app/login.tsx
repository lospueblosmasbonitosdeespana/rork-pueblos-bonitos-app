import { router } from 'expo-router';
import { ArrowLeft, LogIn } from 'lucide-react-native';
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth';

const LPBE_RED = '#c1121f';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login, socialLogin } = useAuth();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const passwordInputRef = React.useRef<TextInput>(null);

  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: '1081426318925-oa71cbdce7jq5p0oaub6k7hep9k10e2p.apps.googleusercontent.com',
    androidClientId: '1081426318925-t9te7mktcsboi1hj32j87qdjr8kvqpml.apps.googleusercontent.com',
    webClientId: '1081426318925-s78gq8tlgm7o6k6k6bhglqf7jvcnk5eh.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleGoogleSuccess = React.useCallback(async (authentication: any) => {
    if (!authentication?.idToken) {
      Alert.alert('Error', 'No se pudo obtener el token de Google');
      return;
    }

    setIsGoogleLoading(true);
    queryClient.clear();

    try {
      const response = await fetch('https://lospueblosmasbonitosdeespana.org/wp-json/um/v1/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          token: authentication.idToken,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.user_id) {
        const loginResult = await socialLogin(result.user_id.toString());

        if (loginResult.success) {
          router.replace('/(tabs)/profile');
        } else {
          Alert.alert('Error', 'No se pudo completar el inicio de sesión con Google.');
        }
      } else {
        Alert.alert('Error', result.message || 'No se pudo completar el inicio de sesión con Google.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'No se pudo completar el inicio de sesión. Inténtalo de nuevo.');
    } finally {
      setIsGoogleLoading(false);
    }
  }, [socialLogin, queryClient]);

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleSuccess(googleResponse.authentication);
    }
  }, [googleResponse, handleGoogleSuccess]);


  const handleGoogleLogin = async () => {
    try {
      await googlePromptAsync();
    } catch (error) {
      console.error('Google prompt error:', error);
      Alert.alert('Error', 'No se pudo iniciar el proceso de Google');
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Información', 'El inicio de sesión con Apple solo está disponible en iOS');
      return;
    }

    try {
      setIsAppleLoading(true);
      queryClient.clear();

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert('Error', 'No se pudo obtener el token de Apple');
        return;
      }

      const response = await fetch('https://lospueblosmasbonitosdeespana.org/wp-json/um/v1/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'apple',
          token: credential.identityToken,
          user: credential.user,
          email: credential.email,
          fullName: credential.fullName,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.user_id) {
        const loginResult = await socialLogin(result.user_id.toString());

        if (loginResult.success) {
          router.replace('/(tabs)/profile');
        } else {
          Alert.alert('Error', 'No se pudo completar el inicio de sesión con Apple.');
        }
      } else {
        Alert.alert('Error', result.message || 'No se pudo completar el inicio de sesión con Apple.');
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('Usuario canceló el login con Apple');
      } else {
        console.error('Apple login error:', error);
        Alert.alert('Error', 'No se pudo completar el inicio de sesión. Inténtalo de nuevo.');
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    
    console.log('🧹 Limpiando React Query antes de login...');
    queryClient.clear();
    console.log('✅ React Query limpiado');
    
    const result = await login({ username: trimmedUsername, password: trimmedPassword });
    setIsLoading(false);

    if (result.success) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace('/(tabs)/profile');
      });
    } else {
      Alert.alert('Error', result.error || 'Credenciales incorrectas o usuario no encontrado');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/home');
          }
        }}
        activeOpacity={0.7}
      >
        <ArrowLeft size={24} color="#1a1a1a" strokeWidth={2} />
      </TouchableOpacity>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LogIn size={48} color={LPBE_RED} strokeWidth={2} />
              </View>
              <Text style={styles.title}>Iniciar Sesión</Text>
              <Text style={styles.subtitle}>
                Accede a tu cuenta de Los Pueblos Más Bonitos de España
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email o usuario</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email o usuario"
                  placeholderTextColor="#999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!isLoading}
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  editable={!isLoading}
                  onSubmitEditing={handleLogin}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, (isLoading || !username.trim() || !password.trim()) && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading || !username.trim() || !password.trim()}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                activeOpacity={0.8}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color="#666" />
                ) : (
                  <>
                    <Text style={styles.socialButtonIcon}>G</Text>
                    <Text style={styles.socialButtonText}>Continuar con Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.appleButton]}
                  onPress={handleAppleLogin}
                  disabled={isAppleLoading || isLoading}
                  activeOpacity={0.8}
                >
                  {isAppleLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.appleButtonIcon}></Text>
                      <Text style={styles.appleButtonText}>Continuar con Apple</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/register')}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>Regístrate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute' as const,
    top: 60,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  content: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: LPBE_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  button: {
    backgroundColor: LPBE_RED,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: LPBE_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    color: '#666',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: LPBE_RED,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
    fontWeight: '500' as const,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialButtonIcon: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#4285F4',
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  appleButtonIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#fff',
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
