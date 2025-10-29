import { router } from 'expo-router';
import { useEffect } from 'react';

import { useUser } from '@/contexts/userContext';

export default function PerfilTabScreen() {
  const { isAuthenticated } = useUser();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/perfil');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated]);

  return null;
}
