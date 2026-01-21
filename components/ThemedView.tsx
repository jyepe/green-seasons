import {
  ActivityIndicator,
  Modal,
  type ModalProps,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewProps,
  type DimensionValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background'
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

/**
 * Shared loading view with spinner and text.
 * Replaces duplicated "View > ActivityIndicator + Text" patterns.
 */
export function LoadingView({
  message = 'Loading...',
  style,
  ...props
}: ViewProps & { message?: string }) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[styles.loadingContainer, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      {...props}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

/**
 * Shared modal layout with overlay, content box, and header.
 */
export function ThemedModal({
  visible,
  onClose,
  title,
  children,
  maxWidth = 500,
  ...modalProps
}: ModalProps & {
  onClose: () => void;
  title: string;
  maxWidth?: DimensionValue;
}) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...modalProps}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface, maxWidth },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseButton}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

/**
 * Shared modal footer with Cancel and Save buttons.
 */
export function ModalFooter({
  onCancel,
  onSave,
  cancelLabel = 'Cancel',
  saveLabel = 'Save',
  isLoading = false,
  isSaveDisabled = false,
}: {
  onCancel: () => void;
  onSave: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  isLoading?: boolean;
  isSaveDisabled?: boolean;
}) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.modalActions}>
      <TouchableOpacity
        style={[
          styles.modalButton,
          styles.modalButtonCancel,
          { borderColor: colors.border },
        ]}
        onPress={onCancel}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
      >
        <Text style={[styles.modalButtonText, { color: colors.text }]}>
          {cancelLabel}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.modalButton,
          styles.modalButtonSave,
          { backgroundColor: colors.primary },
        ]}
        onPress={onSave}
        disabled={isLoading || isSaveDisabled}
        accessibilityRole="button"
        accessibilityLabel={saveLabel}
        accessibilityState={{
          disabled: isLoading || isSaveDisabled,
          busy: isLoading,
        }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.modalButtonTextSave}>{saveLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonSave: {
    // backgroundColor set via prop
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter_600SemiBold',
  },
});
