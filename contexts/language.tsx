import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { getLocales } from 'expo-localization';

import { translations, Language } from '@/constants/translations';

const LANGUAGE_KEY = '@lpbe_language';

function getSystemLanguage(): Language {
  const locales = getLocales();
  const systemLang = locales[0]?.languageCode;
  return systemLang === 'es' || systemLang === 'en' ? systemLang : 'es';
}

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const queryClient = useQueryClient();

  const languageQuery = useQuery<Language>({
    queryKey: ['language'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored && (stored === 'es' || stored === 'en')) {
        return stored as Language;
      }
      return getSystemLanguage();
    },
    staleTime: Infinity,
  });

  const setLanguageMutation = useMutation({
    mutationFn: async (language: Language) => {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
      return language;
    },
    onSuccess: (language) => {
      queryClient.setQueryData(['language'], language);
    },
  });

  const { mutateAsync: setLanguageAsync } = setLanguageMutation;

  const setLanguage = useCallback(
    (language: Language) => {
      return setLanguageAsync(language);
    },
    [setLanguageAsync]
  );

  const language = languageQuery.data || 'es';
  const t = translations[language];

  return useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isLoading: languageQuery.isLoading,
    }),
    [language, setLanguage, t, languageQuery.isLoading]
  );
});
