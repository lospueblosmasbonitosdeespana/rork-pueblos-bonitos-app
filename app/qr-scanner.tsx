import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import QRScanner from '@/components/QRScanner';
import { useLanguage } from '@/contexts/language';
import { registrarVisita } from '@/services/api';

export default function QRScannerScreen() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    router.back();
  };

  const handleScan = async (data: string) => {
    console.log('🔍 QR scanned:', data);

    try {
      const qrData = JSON.parse(data);
      
      if (qrData.type === 'pueblo' && qrData.id) {
        const result = await registrarVisita(qrData.id);
        
        if (result.success) {
          Alert.alert(t.common.success, t.qr.visitRegistered, [
            { text: t.common.close, onPress: handleClose },
          ]);
        } else {
          Alert.alert(t.common.error, t.qr.visitError);
        }
      } else {
        Alert.alert(t.common.error, t.qr.invalidQR);
      }
    } catch (error) {
      console.error('❌ Error processing QR:', error);
      Alert.alert(t.common.error, t.qr.invalidQR);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <QRScanner visible={visible} onClose={handleClose} onScan={handleScan} />
    </>
  );
}
