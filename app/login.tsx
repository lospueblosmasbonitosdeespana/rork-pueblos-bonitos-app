import { router } from 'expo-router';
import { ArrowLeft, LogIn, X } from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
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

const WP_BASE_URL = 'https://lospueblosmasbonitosdeespana.org';

export default function LoginScreen() {
  const { socialLogin } = useAuth();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [socialProvider, setSocialProvider] = useState<'google' | 'apple' | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const passwordInputRef = React.useRef<TextInput>(null);
  const webViewRef = useRef<WebView>(null);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      if (provider === 'google') {
        setIsGoogleLoading(true);
      } else {
        setIsAppleLoading(true);
      }
      
      queryClient.clear();

      console.log(`🔗 Abriendo login social ${provider} en WebView...`);
      setSocialProvider(provider);
      setShowWebView(true);
      
    } catch (error: any) {
      console.error(`❌ Error login ${provider}:`, error);
      Alert.alert(
        'Error de autenticación',
        error.message || 'No se pudo completar el inicio de sesión. Por favor, inténtalo de nuevo.'
      );
      setIsGoogleLoading(false);
      setIsAppleLoading(false);
    }
  };

  const handleWebViewNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    console.log('🌐 WebView URL:', url);

    if (url.includes('/account-2/') || url.includes('/mi-cuenta/') || url.includes('/my-account/')) {
      console.log('✅ Redirigido a la página de cuenta, validando sesión...');
      
      webViewRef.current?.injectJavaScript(`
        (async function() {
          try {
            const response = await fetch('${WP_BASE_URL}/wp-json/wp/v2/users/me', {
              credentials: 'include',
              headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
              const userData = await response.json();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'USER_DATA',
                data: userData
              }));
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: 'No se pudo validar la sesión'
              }));
            }
          } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ERROR',
              message: error.message
            }));
          }
        })();
        true;
      `);
    }
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📨 Mensaje de WebView:', message);

      if (message.type === 'USER_DATA') {
        const userData = message.data;
        console.log('✅ Usuario autenticado:', userData.name, '(ID:', userData.id, ')');
        
        setShowWebView(false);
        setSocialProvider(null);
        
        const loginResult = await socialLogin(userData.id.toString());
        
        if (loginResult.success) {
          console.log('✅ Login social completado');
          setIsGoogleLoading(false);
          setIsAppleLoading(false);
          router.replace('/(tabs)/profile');
        } else {
          throw new Error('No se pudo completar el inicio de sesión');
        }
      } else if (message.type === 'ERROR') {
        throw new Error(message.message);
      }
    } catch (error: any) {
      console.error('❌ Error procesando mensaje WebView:', error);
      setShowWebView(false);
      setSocialProvider(null);
      setIsGoogleLoading(false);
      setIsAppleLoading(false);
      Alert.alert(
        'Error',
        'No se pudo completar el inicio de sesión. Por favor, inténtalo de nuevo.'
      );
    }
  };

  const handleCloseWebView = () => {
    setShowWebView(false);
    setSocialProvider(null);
    setIsGoogleLoading(false);
    setIsAppleLoading(false);
  };

  const handleGoogleLogin = () => handleSocialLogin('google');
  const handleAppleLogin = () => handleSocialLogin('apple');

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
    
    try {
      const response = await fetch(`${WP_BASE_URL}/wp-json/jwt-auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user_id) {
        const loginResult = await socialLogin(data.user_id.toString());

        if (loginResult.success) {
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
          Alert.alert('Error', 'No se pudo completar el inicio de sesión.');
        }
      } else {
        Alert.alert('Error', data.message || 'Credenciales incorrectas o usuario no encontrado');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', 'No se pudo completar el inicio de sesión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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

    <Modal
      visible={showWebView}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCloseWebView}
    >
      <SafeAreaView style={styles.webViewContainer} edges={['top', 'bottom']}>
        <View style={styles.webViewHeader}>
          <Text style={styles.webViewTitle}>
            {socialProvider === 'google' ? 'Iniciar sesión con Google' : 'Iniciar sesión con Apple'}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCloseWebView}
            activeOpacity={0.7}
          >
            <X size={24} color="#1a1a1a" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        {socialProvider && (
          <WebView
            ref={webViewRef}
            source={{ uri: `${WP_BASE_URL}/wp-login.php?loginSocial=${socialProvider}` }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={LPBE_RED} />
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
    </>
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
  webViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute' as const,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewLoading: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
