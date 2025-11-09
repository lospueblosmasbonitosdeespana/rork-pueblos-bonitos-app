import { AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Notificacion } from '@/types/api';

interface NotificationCardProps {
  notification: Notificacion;
}

export default function NotificationCard({ notification }: NotificationCardProps) {
  const getIcon = () => {
    switch (notification.tipo) {
      case 'urgente':
        return <AlertCircle size={20} color={COLORS.error} />;
      case 'alerta':
        return <AlertTriangle size={20} color="#f59e0b" />;
      default:
        return <Info size={20} color={COLORS.green} />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.tipo) {
      case 'urgente':
        return '#fee2e2';
      case 'alerta':
        return '#fef3c7';
      default:
        return '#dcfce7';
    }
  };

  const getBorderColor = () => {
    switch (notification.tipo) {
      case 'urgente':
        return COLORS.error;
      case 'alerta':
        return '#f59e0b';
      default:
        return COLORS.green;
    }
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: getBackgroundColor(),
      borderLeftColor: getBorderColor(),
    }]}>
      <View style={styles.iconContainer}>{getIcon()}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{notification.titulo}</Text>
        <Text style={styles.message}>{notification.mensaje}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: 8,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    ...SHADOWS.small,
  },
  iconContainer: {
    marginRight: SPACING.sm,
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});
