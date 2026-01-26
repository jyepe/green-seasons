import React from 'react';
import {
  ActivityIndicator,
  Modal,
  type ModalProps,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewProps,
  type DimensionValue,
  TextInput,
  type TextInputProps,
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
  size = 'large',
  style,
  ...props
}: ViewProps & { message?: string; size?: 'small' | 'large' }) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[styles.loadingContainer, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      {...props}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      {message ? (
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {message}
        </Text>
      ) : null}
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
            <Text
              style={[styles.modalTitle, { color: colors.text }]}
              accessibilityRole="header"
            >
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

/**
 * Shared dropdown component with label, selector, and list.
 * Consolidates repeated dropdown logic in management screens.
 */
export function ThemedDropdown({
  label,
  value,
  placeholder = 'Select an option',
  isOpen,
  onToggle,
  items,
  onSelect,
  emptyMessage = 'No options available',
}: {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
  isOpen: boolean;
  onToggle: () => void;
  items: { id: string | number; label: string }[];
  onSelect: (id: string | number) => void;
  emptyMessage?: string;
}) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          {
            borderColor: colors.border,
            backgroundColor: colors.inputBackground,
          },
        ]}
        onPress={onToggle}
        accessibilityLabel={value ? `${label}, ${value}` : `Select ${label}`}
        accessibilityHint={`Double tap to change ${label}`}
        accessibilityRole="combobox"
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={styles.selectorLabelContainer}>
          <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
          <Text
            style={[styles.selectorValue, { color: colors.text }]}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {isOpen && items.length > 0 ? (
        <ScrollView
          style={[
            styles.dropdown,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
          nestedScrollEnabled
        >
          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.dropdownItem,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => onSelect(item.id)}
              accessibilityLabel={`Select ${item.label}`}
              accessibilityRole="button"
            >
              <Text
                style={[styles.dropdownItemTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {isOpen && items.length === 0 ? (
        <View
          style={[
            styles.emptyDropdown,
            {
              borderColor: colors.border,
              backgroundColor: colors.inputBackground,
            },
          ]}
        >
          <Text
            style={[styles.emptyDropdownText, { color: colors.textSecondary }]}
          >
            {emptyMessage}
          </Text>
        </View>
      ) : null}
    </>
  );
}

/**
 * Shared input component with label, error text, and consistent styling.
 * Consolidates repeated "Label + Input + Error" pattern.
 */
export const ThemedInput = React.forwardRef<
  TextInput,
  TextInputProps & {
    label?: string;
    error?: string;
    containerStyle?: ViewProps['style'];
  }
>(({ style, label, error, containerStyle, ...props }, ref) => {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && (
        <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      )}
      <TextInput
        ref={ref}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.textSecondary + '80'}
        accessibilityLabel={label}
        {...props}
      />
      {error && (
        <Text style={[styles.inputError, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
});

ThemedInput.displayName = 'ThemedInput';

/**
 * Shared search bar component with icon, input, and clear button.
 * Consolidates repeated search bar logic.
 */
export function ThemedSearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewProps['style'];
}) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.searchBarContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Ionicons
        name="search"
        size={20}
        color={colors.textSecondary}
        style={styles.searchBarIcon}
      />
      <TextInput
        style={[styles.searchBarInput, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary + '80'}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.searchBarClearButton}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
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
  // Dropdown Styles
  selector: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectorLabelContainer: {
    flex: 1,
    gap: 4,
  },
  selectorLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  selectorValue: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  dropdown: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    maxHeight: 260,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyDropdown: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  emptyDropdownText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  // Input Styles
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    minHeight: 48,
  },
  inputError: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  // SearchBar Styles
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchBarIcon: {
    // No specific style needed beyond color/size handled inline, but keeping for consistency if needed
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  searchBarClearButton: {
    padding: 4,
  },
});
