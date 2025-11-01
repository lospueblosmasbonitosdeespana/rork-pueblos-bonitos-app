import * as ImagePicker from 'expo-image-picker';
import { Camera, Edit2, Mail, Save, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function CuentaInfoScreen() {
  const { user, isLoading } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  
  const [syncedData, setSyncedData] = useState<{
    id: number;
    name: string;
    email: string;
    username: string;
    photo: string | null;
  } | null>(null);
  
  const [editedName, setEditedName] = useState('');

  React.useEffect(() => {
    const syncUserData = async () => {
      if (!user?.id) {
        setIsSyncing(false);
        return;
      }

      try {
        setIsSyncing(true);
        setSyncError(null);
        console.log('🔄 Sincronizando datos del usuario desde /user-profile:', user.id);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(
          `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/user-profile?user_id=${user.id}`,
          {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error('❌ Error en GET /user-profile:', response.status);
          if (response.status === 404) {
            setSyncError('Perfil no encontrado. Usando datos locales.');
          } else {
            setSyncError('No se pudo cargar el perfil. Usando datos locales.');
          }
          setSyncedData({
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            username: user.username || '',
            photo: user.profile_photo || user.avatar_url || null,
          });
          setEditedName(user.name || '');
          setIsSyncing(false);
          return;
        }
        
        const wpData = await response.json();
        console.log('✅ Datos sincronizados correctamente desde /user-profile:', wpData);
        
        setSyncedData({
          id: wpData.id || user.id,
          name: wpData.name || '',
          email: wpData.email || '',
          username: wpData.username || '',
          photo: wpData.photo || null,
        });
        setEditedName(wpData.name || '');
      } catch (error: any) {
        console.error('❌ Error sincronizando datos:', error);
        if (error.name === 'AbortError') {
          setSyncError('Tiempo de espera agotado. Usando datos locales.');
        } else {
          setSyncError('No se pudo cargar el perfil. Usando datos locales.');
        }
        setSyncedData({
          id: user.id,
          name: user.name || '',
          email: user.email || '',
          username: user.username || '',
          photo: user.profile_photo || user.avatar_url || null,
        });
        setEditedName(user.name || '');
      } finally {
        setIsSyncing(false);
      }
    };
    
    syncUserData();
  }, [user?.id]);

  const handleSelectPhoto = async () => {
    if (!user || !syncedData) return;

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

        console.log('📸 Subiendo foto de perfil...');
        
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        const match = /\.([\w]+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('file', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
        formData.append('user_id', user.id.toString());
        
        try {
          const uploadResponse = await fetch(
            'https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/upload-profile-photo',
            {
              method: 'POST',
              body: formData,
              headers: {
                'Accept': 'application/json',
              },
            }
          );
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('❌ Error subiendo imagen:', errorText.substring(0, 200));
            throw new Error('Error al subir la imagen');
          }
          
          const uploadData = await uploadResponse.json();
          const photoUrl = uploadData.image_url || uploadData.url;
          console.log('✅ Imagen subida:', photoUrl);
          
          if (photoUrl) {
            console.log('🔄 Actualizando foto en /user-profile...');
            const updateResponse = await fetch(
              `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/user-profile`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify({
                  user_id: user.id,
                  photo: photoUrl,
                }),
              }
            );
            
            if (updateResponse.ok) {
              const updateData = await updateResponse.json();
              console.log('✅ Foto actualizada en el perfil:', updateData);
              setSyncedData(prev => prev ? { ...prev, photo: photoUrl } : null);
              
              if (Platform.OS === 'web') {
                alert('Foto de perfil actualizada correctamente');
              } else {
                Alert.alert('Éxito', 'Foto de perfil actualizada correctamente', [{ text: 'OK' }]);
              }
            } else {
              const errorText = await updateResponse.text();
              console.error('❌ Error actualizando perfil:', errorText.substring(0, 200));
              throw new Error('Error al actualizar el perfil');
            }
          }
        } catch (error: any) {
          console.error('❌ Error en upload/update:', error);
          if (Platform.OS === 'web') {
            alert('Error al actualizar la foto. Inténtalo de nuevo.');
          } else {
            Alert.alert('Error', 'Error al actualizar la foto. Inténtalo de nuevo.', [{ text: 'OK' }]);
          }
        } finally {
          setIsUploading(false);
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

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) return;

    setIsUpdatingName(true);

    try {
      console.log('✏️ Actualizando nombre a:', editedName.trim());
      
      const response = await fetch(
        `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/user-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            name: editedName.trim(),
          }),
        }
      );
      
      setIsUpdatingName(false);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Nombre actualizado exitosamente:', data);
        
        setSyncedData(prev => prev ? { ...prev, name: editedName.trim() } : null);
        setIsEditingName(false);
        
        if (Platform.OS === 'web') {
          alert(data.message || 'Nombre actualizado correctamente');
        } else {
          Alert.alert('Éxito', data.message || 'Nombre actualizado correctamente', [{ text: 'OK' }]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText.substring(0, 200));
        
        if (Platform.OS === 'web') {
          alert('Error al actualizar el nombre. Inténtalo de nuevo.');
        } else {
          Alert.alert('Error', 'Error al actualizar el nombre. Inténtalo de nuevo.', [{ text: 'OK' }]);
        }
      }
    } catch (error: any) {
      setIsUpdatingName(false);
      console.error('❌ Error actualizando nombre:', error);
      
      if (Platform.OS === 'web') {
        alert('Error de conexión. Verifica tu conexión a internet.');
      } else {
        Alert.alert('Error', 'Error de conexión. Verifica tu conexión a internet.', [{ text: 'OK' }]);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditedName(syncedData?.name || '');
    setIsEditingName(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No se pudo cargar el perfil.</Text>
          <Text style={styles.errorSubtext}>Por favor, inicia sesión de nuevo.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSyncing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
          <Text style={styles.loadingText}>Sincronizando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!syncedData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error al cargar información</Text>
          <Text style={styles.errorSubtext}>Inténtalo de nuevo más tarde</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = syncedData.name || user.name;
  const displayEmail = syncedData.email || user.email;
  const displayUsername = syncedData.username || user.username;
  const displayAvatar = syncedData.photo || user.profile_photo || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=200&background=c1121f&color=fff`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {syncError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{syncError}</Text>
          </View>
        )}
        
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
          <Text style={styles.name}>{displayName}</Text>
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
                {isEditingName ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={editedName}
                      onChangeText={setEditedName}
                      placeholder="Nombre completo"
                      autoFocus
                      editable={!isUpdatingName}
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        style={[styles.editButton, styles.saveButton]}
                        onPress={handleSaveName}
                        disabled={isUpdatingName || !editedName.trim()}
                      >
                        {isUpdatingName ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Save size={18} color="#fff" strokeWidth={2} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editButton, styles.cancelButton]}
                        onPress={handleCancelEdit}
                        disabled={isUpdatingName}
                      >
                        <X size={18} color="#666" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.valueWithEdit}>
                    <Text style={styles.infoValue}>{displayName}</Text>
                    <TouchableOpacity
                      style={styles.editIconButton}
                      onPress={() => setIsEditingName(true)}
                    >
                      <Edit2 size={18} color={LPBE_RED} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                )}
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
                <Text style={styles.infoValue}>{displayEmail}</Text>
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
                <Text style={styles.infoValue}>{displayUsername}</Text>
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
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
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
  valueWithEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editIconButton: {
    padding: 6,
  },
  editContainer: {
    gap: 12,
  },
  editInput: {
    fontSize: 17,
    color: '#1a1a1a',
    fontWeight: '600' as const,
    borderBottomWidth: 2,
    borderBottomColor: LPBE_RED,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: LPBE_RED,
  },
  cancelButton: {
    backgroundColor: '#e8e8e8',
  },
});
