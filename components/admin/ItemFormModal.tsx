import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Item, CreateItemParams, UpdateItemParams } from '@/lib/supabase';

type ItemFormData = {
  name: string;
  description: string;
  price: string;
  unit: string;
  image_url: string;
};

type ItemFormModalProps = {
  visible: boolean;
  item: Item | null; // null for create mode, Item for edit mode
  isLoading: boolean;
  onClose: () => void;
  onSave: (data: CreateItemParams | UpdateItemParams) => void;
};

export function ItemFormModal({
  visible,
  item,
  isLoading,
  onClose,
  onSave,
}: ItemFormModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [formData, setFormData] = React.useState<ItemFormData>({
    name: '',
    description: '',
    price: '',
    unit: '',
    image_url: '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Initialize form data when modal opens or item changes
  React.useEffect(() => {
    if (visible) {
      if (item) {
        // Edit mode: populate with existing item data
        setFormData({
          name: item.name,
          description: item.description || '',
          price: item.price.toString(),
          unit: item.unit,
          image_url: item.image_url || '',
        });
      } else {
        // Create mode: reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          unit: '',
          image_url: '',
        });
      }
      setErrors({});
    }
  }, [visible, item]);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2)
          return 'Name must be at least 2 characters';
        return '';

      case 'price':
        if (!value.trim()) return 'Price is required';
        const priceNum = parseFloat(value);
        if (isNaN(priceNum) || priceNum <= 0)
          return 'Price must be a positive number';
        return '';

      case 'unit':
        if (!value.trim()) return 'Unit is required';
        return '';

      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    const nameError = validateField('name', formData.name);
    if (nameError) {
      newErrors.name = nameError;
      isValid = false;
    }

    const priceError = validateField('price', formData.price);
    if (priceError) {
      newErrors.price = priceError;
      isValid = false;
    }

    const unitError = validateField('unit', formData.unit);
    if (unitError) {
      newErrors.unit = unitError;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (field: keyof ItemFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const priceNum = parseFloat(formData.price);

    if (item) {
      // Edit mode: only send changed fields
      const updateParams: UpdateItemParams = {};
      if (formData.name !== item.name) updateParams.name = formData.name;
      if (formData.description !== (item.description || ''))
        updateParams.description = formData.description || null;
      if (priceNum !== item.price) updateParams.price = priceNum;
      if (formData.unit !== item.unit) updateParams.unit = formData.unit;
      if (formData.image_url !== (item.image_url || ''))
        updateParams.image_url = formData.image_url || null;

      onSave(updateParams);
    } else {
      // Create mode: send all required fields
      const createParams: CreateItemParams = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: priceNum,
        unit: formData.unit.trim(),
        image_url: formData.image_url.trim() || null,
      };

      onSave(createParams);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {item ? 'Edit Item' : 'Add New Item'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: errors.name ? colors.error : colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.name}
                onChangeText={value => handleInputChange('name', value)}
                placeholder="Enter item name"
                placeholderTextColor={colors.textSecondary + '80'}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.name && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.name}
                </Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.description}
                onChangeText={value => handleInputChange('description', value)}
                placeholder="Enter item description (optional)"
                placeholderTextColor={colors.textSecondary + '80'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoCapitalize="sentences"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Price *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: errors.price ? colors.error : colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={formData.price}
                  onChangeText={value => handleInputChange('price', value)}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary + '80'}
                  keyboardType="decimal-pad"
                />
                {errors.price && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.price}
                  </Text>
                )}
              </View>

              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Unit *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: errors.unit ? colors.error : colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={formData.unit}
                  onChangeText={value => handleInputChange('unit', value)}
                  placeholder="lb, kg, each"
                  placeholderTextColor={colors.textSecondary + '80'}
                  autoCapitalize="none"
                />
                {errors.unit && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.unit}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Image URL
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.image_url}
                onChangeText={value => handleInputChange('image_url', value)}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor={colors.textSecondary + '80'}
                autoCapitalize="none"
                keyboardType="url"
                autoCorrect={false}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonCancel,
                { borderColor: colors.border },
              ]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text
                style={[styles.modalButtonText, { color: colors.text }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonSave,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.modalButtonTextSave}>
                  {item ? 'Save' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
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
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 4,
  },
  label: {
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
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
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
    // backgroundColor set inline
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
