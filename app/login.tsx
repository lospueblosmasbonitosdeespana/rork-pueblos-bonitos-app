console.log("🔥🔥 LOGIN.TSX ACTIVO DESDE ESTA CARPETA (NATIVO GOOGLE) 🔥🔥");

import { router } from 'expo-router';
import { ArrowLeft, LogIn } from 'lucide-react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as GoogleSignIn from 'expo-google-sign-in';
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
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const passwordInputRef = React.useRef<TextInput>(null);

  //--------------------------------------------
  // GOOGLE SIGN-IN NATIVO
  //--------------------------------------------
  useEffect(() => {
    async function initGoogle() {
      try {
        await GoogleSignIn.initAsync({
          clientId:
            "1050453988650-cq20qu63m02778k7ihkmghim6n0073og.apps.googleusercontent.com",
        });

        console.log("🔥 GoogleSignIn inicializado correctamente");
      } catch (error) {
        console.log("❌ Error inicializando GoogleSignIn:", error);
      }
    }
    initGoogle();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);

      const { type, user } = await GoogleSignIn.signInAsync();

      if (type !== 'success' || !user?.auth?.idToken) {
        setIsGoogleLoading(false);
        console.log("❌ Login cancelado o sin idToken");
        return;
      }

      console.log("🔥 ID TOKEN GOOGLE:", user.auth.idToken);

      await handleGoogleNativeLogin(user.auth.idToken);

    } catch (error) {
      console.log("❌ Error en GoogleSignIn:", error);
      Alert.alert("Error", "No se pudo iniciar sesión con Google.");
      setIsGoogleLoading(false);
    }
  };

  //--------------------------------------------
  // ENVÍO DEL TOKEN A TU BACKEND (ESTO ESTABA PERFECTO)
  //--------------------------------------------
  const handleGoogleNativeLogin = useCallback(async (idToken: string) => {
    try {
      console.log('📡 Enviando id_token de Google al backend...');

      const response = await fetch(
        'https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v2/google-login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken }),
        }
      );

      console.log('📊 Google Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error Google Login:', errorData);
        Alert.alert(
          'Error',
          errorData.message || 'No se pudo completar el inicio de sesión con Google.'
        );
        setIsGoogleLoading(false);
        return;
      }

      const data = await response.json();
      console.log('✅ Google Login exitoso:', data);

      if (!data.jwt || !data.user) {
        Alert.alert('Error', 'Respuesta del servidor inválida.');
        setIsGoogleLoading(false);
        return;
      }

      const result = await login(
        { username: '', password: '' },
        { googleJwt: data.jwt, googleUser: data.user }
      );

      if (result.success) {
        console.log('✅ Google Login completado!');
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => router.replace('/(tabs)/profile'));
      } else {
        Alert.alert('Error', result.error || 'No se pudo completar la operación.');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'No se pudo completar el inicio de sesión con Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  }, [login, fadeAnim]);

  //--------------------------------------------
  // ANIMACIÓN
  //--------------------------------------------
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  //--------------------------------------------
  // APPLE LOGIN (NO TOCO NADA)
  //--------------------------------------------
  const handleAppleLogin = async () => {
    try {
      setIsAppleLoading(true);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert('Error', 'No se recibió el token de Apple.');
        return;
      }

      const result = await login(
        { username: '', password: '' },
        { appleIdentityToken: credential.identityToken }
      );

      if (result.success) {
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => router.replace('/(tabs)/profile'));
      } else {
        Alert.alert('Error', result.error || 'Error al iniciar sesión con Apple.');
      }
    } catch (error) {
      console.error('Apple login error:', error);
      Alert.alert('Error', 'No se pudo completar el inicio de sesión con Apple.');
    } finally {
      setIsAppleLoading(false);
    }
  };

  //--------------------------------------------
  // LOGIN NORMAL (NO TOCO NADA)
  //--------------------------------------------
  const handleLogin = async () => {
    const u = username.trim();
    const p = password.trim();

    if (!u || !p) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    queryClient.clear();

    const result = await login({ username: u, password: p });
    setIsLoading(false);

    if (result.success) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => router.replace('/(tabs)/profile'));
    } else {
      Alert.alert('Error', result.error || 'Credenciales incorrectas');
    }
  };

  //--------------------------------------------
  // UI (NO TOCO NADA)
  //--------------------------------------------
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
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

              {/* LOGIN USUARIO NORMAL */}
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
                style={[
                  styles.button,
                  (isLoading || !username.trim() || !password.trim()) && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading || !username.trim() || !password.trim()}
                activeOpacity={0.8}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> :
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>}
              </TouchableOpacity>

              {/* Divider social */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* GOOGLE LOGIN NATIVO */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                activeOpacity={0.8}
              >
                {isGoogleLoading ?
                  <ActivityIndicator color="#666" /> : (
                    <>
                      <Text style={styles.socialButtonIcon}>G</Text>
                      <Text style={styles.socialButtonText}>Continuar con Google</Text>
                    </>
                  )}
              </TouchableOpacity>

              {/* APPLE LOGIN (NO TOCADO) */}
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
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 🔥 ESTILOS (NO TOCADOS)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backButton: {
    position: 'absolute',
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
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
  content: { paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
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
  title: { fontSize: 32, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 28 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText: { marginHorizontal: 16, fontSize: 14, color: '#999', fontWeight: '500' },
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
  socialButtonIcon: { fontSize: 20, fontWeight: '700', color: '#4285F4', marginRight: 12 },
  socialButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  appleButton: { backgroundColor: '#000', borderColor: '#000' },
  appleButtonIcon: { fontSize: 20, marginRight: 12, color: '#fff' },
  appleButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});