import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { ThemedModal, ModalFooter } from '@/components/ThemedView';

export type EditingItem = {
  item_id: string;
  item_name: string;
  quantity: number;
  item_price: number;
};

type EditQuantityModalProps = {
  editingItem: EditingItem | null;
  editQuantity: string;
  updatingItemId: string | null;
  onClose: () => void;
  onSave: () => void;
  setEditQuantity: (quantity: string) => void;
};

export function EditQuantityModal({
  editingItem,
  editQuantity,
  updatingItemId,
  onClose,
  onSave,
  setEditQuantity,
}: EditQuantityModalProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ThemedModal
      visible={editingItem !== null}
      onClose={onClose}
      title="Edit Quantity"
      maxWidth={400}
    >
      {editingItem && (
        <>
          <Text style={[styles.modalItemName, { color: colors.text }]}>
            {editingItem.item_name}
          </Text>
          <Text
            style={[styles.modalItemPrice, { color: colors.textSecondary }]}
          >
            ${editingItem.item_price.toFixed(2)} each
          </Text>
          <View style={styles.modalQuantityContainer}>
            <Text style={[styles.modalLabel, { color: colors.text }]}>
              Quantity
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="number-pad"
              selectTextOnFocus
              autoFocus
              accessibilityLabel="Quantity"
            />
          </View>
          <ModalFooter
            onCancel={onClose}
            onSave={onSave}
            isLoading={updatingItemId === editingItem.item_id}
            isSaveDisabled={updatingItemId === editingItem.item_id}
          />
        </>
      )}
    </ThemedModal>
  );
}

const styles = StyleSheet.create({
  modalItemName: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalItemPrice: {
    fontSize: 14,
    marginTop: -8,
  },
  modalQuantityContainer: {
    marginTop: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});
