import * as ImagePicker from 'expo-image-picker';
import { Camera, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth';
import { uploadProfilePhoto, getUserProfilePhoto } from '@/services/api';

const LPBE_RED = '#c1121f';

export default function CuentaInfoScreen() {
  const { user, isLoading, checkAuth } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);

  React.useEffect(() => {
    if (user?.id) {
      getUserProfilePhoto(user.id.toString()).then((photoUrl) => {
        if (photoUrl) {
          setCurrentAvatar(photoUrl);
        }
      });
    }
  }, [user?.id]);

  const handleSelectPhoto = async () => {
    if (!user) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        if (Platform.OS === 'web') {
          alert('Se necesita permiso para acceder a la galería');
        } else {
          Alert.alert(
            'Permiso requerido',
            'Se necesita permiso para acceder a la galería de fotos',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setIsUploading(true);

        const uploadResult = await uploadProfilePhoto(
          user.id.toString(),
          imageUri
        );

        setIsUploading(false);

        if (uploadResult.success) {
          if (uploadResult.imageUrl) {
            setCurrentAvatar(uploadResult.imageUrl);
          }

          await checkAuth();

          if (Platform.OS === 'web') {
            alert(uploadResult.message);
          } else {
            Alert.alert('Éxito', uploadResult.message, [{ text: 'OK' }]);
          }
        } else {
          if (Platform.OS === 'web') {
            alert(uploadResult.message);
          } else {
            Alert.alert('Error', uploadResult.message, [{ text: 'OK' }]);
          }
        }
      }
    } catch (error: any) {
      setIsUploading(false);
      console.error('Error selecting photo:', error);
      
      if (Platform.OS === 'web') {
        alert('Error al seleccionar la foto');
      } else {
        Alert.alert('Error', 'Error al seleccionar la foto', [{ text: 'OK' }]);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.name;
  const displayAvatar = currentAvatar || user.profile_photo || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=200&background=c1121f&color=fff`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleSelectPhoto}
            activeOpacity={0.7}
            disabled={isUploading}
          >
            <Image
              source={{ uri: displayAvatar }}
              style={styles.avatar}
              resizeMode="cover"
            />
            {isUploading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : (
              <View style={styles.avatarOverlay}>
                <Camera size={32} color="#fff" strokeWidth={2} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.changePhotoHint}>Toca la imagen para cambiar</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <User size={24} color={LPBE_RED} strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nombre Completo</Text>
                <Text style={styles.infoValue}>{fullName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Mail size={24} color={LPBE_RED} strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Correo Electrónico</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <User size={24} color={LPBE_RED} strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nombre de Usuario</Text>
                <Text style={styles.infoValue}>{user.username}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  scrollContent: {
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 16,
    shadowColor: LPBE_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: '#fff',
    position: 'relative' as const,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  avatarOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  changePhotoHint: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  infoSection: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 17,
    color: '#1a1a1a',
    fontWeight: '600' as const,
  },
});
