import { router } from 'expo-router';
import { ArrowLeft, Download } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth';

const LPBE_RED = '#c1121f';
const BG_BEIGE = '#F3EDE3';

interface PrivacySettings {
  hide_profile?: boolean;
  show_last_login?: boolean;
}

export default function PrivacidadScreen() {
  const { isAuthenticated, userId } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hideProfile, setHideProfile] = React.useState(false);
  const [showLastLogin, setShowLastLogin] = React.useState(true);

  const loadPrivacySettings = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://lospueblosmasbonitosdeespana.org/wp-json/um-api/account/privacy?user_id=${userId}`
      );

      if (response.ok) {
        const data: PrivacySettings = await response.json();
        setHideProfile(data.hide_profile || false);
        setShowLastLogin(data.show_last_login !== false);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const savePrivacySettings = async (field: string, value: boolean) => {
    if (!userId) return;

    try {
      setIsSaving(true);
      const response = await fetch(
        'https://lospueblosmasbonitosdeespana.org/wp-json/um-api/account/update-privacy',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            [field]: value,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Descargar datos',
      'Esta función permite descargar todos tus datos personales. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descargar',
          onPress: async () => {
            try {
              const response = await fetch(
                `https://lospueblosmasbonitosdeespana.org/wp-json/um-api/account/download-data?user_id=${userId}`
              );
              if (response.ok) {
                Alert.alert(
                  'Datos solicitados',
                  'Recibirás un correo electrónico con tus datos en breve.'
                );
              } else {
                Alert.alert('Error', 'No se pudieron solicitar tus datos');
              }
            } catch (error) {
              console.error('Error downloading data:', error);
              Alert.alert('Error', 'Error de conexión');
            }
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      loadPrivacySettings();
    }
  }, [isAuthenticated, userId, loadPrivacySettings]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={LPBE_RED} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacidad</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.notAuthContent}>
          <Text style={styles.notAuthText}>
            Inicia sesión para ver tu configuración de privacidad
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={LPBE_RED} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacidad</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={LPBE_RED} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacidad</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Ocultar mi perfil</Text>
            <Text style={styles.settingDescription}>
              Tu perfil no aparecerá en el directorio público
            </Text>
          </View>
          <Switch
            value={hideProfile}
            onValueChange={(value) => {
              setHideProfile(value);
              savePrivacySettings('hide_profile', value);
            }}
            trackColor={{ false: '#d1d5db', true: LPBE_RED }}
            thumbColor="#fff"
            disabled={isSaving}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Mostrar último acceso</Text>
            <Text style={styles.settingDescription}>
              Otros usuarios podrán ver cuándo accediste por última vez
            </Text>
          </View>
          <Switch
            value={showLastLogin}
            onValueChange={(value) => {
              setShowLastLogin(value);
              savePrivacySettings('show_last_login', value);
            }}
            trackColor={{ false: '#d1d5db', true: LPBE_RED }}
            thumbColor="#fff"
            disabled={isSaving}
          />
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownloadData}
          disabled={isSaving}
        >
          <Download size={20} color={LPBE_RED} strokeWidth={2} />
          <Text style={styles.downloadButtonText}>Descargar mis datos</Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Puedes solicitar una copia de todos tus datos personales que tenemos almacenados.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_BEIGE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  placeholder: {
    width: 32,
  },
  notAuthContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notAuthText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginTop: 0,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LPBE_RED,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: LPBE_RED,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
