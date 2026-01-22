import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Item, CreateItemParams, UpdateItemParams } from '@/lib/supabase';
import {
  ThemedModal,
  ModalFooter,
  ThemedInput,
} from '@/components/ThemedView';

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
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

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

        // Enforce a realistic minimum price (e.g., 0.01)
        if (priceNum < 0.01) {
          return 'Price must be at least 0.01';
        }

        // Enforce a maximum of 2 decimal places
        const trimmedValue = value.trim();
        const decimalPointIndex = trimmedValue.indexOf('.');
        if (decimalPointIndex !== -1) {
          const decimalPart = trimmedValue.substring(decimalPointIndex + 1);
          if (decimalPart.length > 2) {
            return 'Price can have at most 2 decimal places';
          }
        }
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
    const normalizedDescription = formData.description.trim() || null;
    const normalizedImageUrl = formData.image_url.trim() || null;

    if (item) {
      // Edit mode: only send changed fields
      const updateParams: UpdateItemParams = {};
      if (formData.name !== item.name) updateParams.name = formData.name;
      if (normalizedDescription !== item.description)
        updateParams.description = normalizedDescription;
      if (priceNum !== item.price) updateParams.price = priceNum;
      if (formData.unit !== item.unit) updateParams.unit = formData.unit;
      if (normalizedImageUrl !== item.image_url)
        updateParams.image_url = normalizedImageUrl;

      // Check if any fields have actually changed
      if (Object.keys(updateParams).length === 0) {
        // No changes detected, close modal without saving
        onClose();
        return;
      }

      onSave(updateParams);
    } else {
      // Create mode: send all required fields
      const createParams: CreateItemParams = {
        name: formData.name.trim(),
        description: normalizedDescription,
        price: priceNum,
        unit: formData.unit.trim(),
        image_url: normalizedImageUrl,
      };

      onSave(createParams);
    }
  };

  return (
    <ThemedModal
      visible={visible}
      onClose={onClose}
      title={item ? 'Edit Item' : 'Add New Item'}
      maxWidth={500}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedInput
          label="Name *"
          value={formData.name}
          onChangeText={value => handleInputChange('name', value)}
          placeholder="Enter item name"
          autoCapitalize="words"
          autoCorrect={false}
          error={errors.name}
          style={{ backgroundColor: colors.background }}
          containerStyle={styles.formGroup}
        />

        <ThemedInput
          label="Description"
          value={formData.description}
          onChangeText={value => handleInputChange('description', value)}
          placeholder="Enter item description (optional)"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          autoCapitalize="sentences"
          style={[styles.textArea, { backgroundColor: colors.background }]}
          containerStyle={styles.formGroup}
        />

        <View style={styles.row}>
          <ThemedInput
            label="Price *"
            value={formData.price}
            onChangeText={value => handleInputChange('price', value)}
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={errors.price}
            style={{ backgroundColor: colors.background }}
            containerStyle={[styles.formGroup, styles.halfWidth]}
          />

          <ThemedInput
            label="Unit *"
            value={formData.unit}
            onChangeText={value => handleInputChange('unit', value)}
            placeholder="lb, kg, each"
            autoCapitalize="none"
            error={errors.unit}
            style={{ backgroundColor: colors.background }}
            containerStyle={[styles.formGroup, styles.halfWidth]}
          />
        </View>

        <ThemedInput
          label="Image URL"
          value={formData.image_url}
          onChangeText={value => handleInputChange('image_url', value)}
          placeholder="https://example.com/image.jpg"
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
          style={{ backgroundColor: colors.background }}
          containerStyle={styles.formGroup}
        />
      </ScrollView>

      <View style={styles.footerWrapper}>
        <ModalFooter
          onCancel={onClose}
          onSave={handleSave}
          saveLabel={item ? 'Save' : 'Create'}
          isLoading={isLoading}
        />
      </View>
    </ThemedModal>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 0,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  footerWrapper: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 8,
  },
});
