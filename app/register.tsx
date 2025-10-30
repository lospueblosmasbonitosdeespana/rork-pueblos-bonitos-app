import { router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    setIsLoading(true);
    const result = await register({
      username: email.split('@')[0],
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    setIsLoading(false);

    if (result.success) {
      Alert.alert(
        '¡Registro exitoso!',
        'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
        [
          {
            text: 'Iniciar Sesión',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'No se pudo completar el registro');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
                <UserPlus size={48} color={LPBE_RED} strokeWidth={2} />
              </View>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>
                Únete a la comunidad de Los Pueblos Más Bonitos de España
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  placeholderTextColor="#999"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Apellidos</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tus apellidos"
                  placeholderTextColor="#999"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar Contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repite la contraseña"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Registrarse</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                <TouchableOpacity
                  onPress={() => router.back()}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>Inicia Sesión</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 20,
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
});
