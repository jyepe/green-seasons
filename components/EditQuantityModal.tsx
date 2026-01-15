import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

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
    <Modal
      visible={editingItem !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[styles.modalTitle, { color: colors.text }]}
              accessibilityRole="header"
            >
              Edit Quantity
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseButton}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
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
                  accessibilityHint="Enter the new quantity"
                />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalButtonCancel,
                    { borderColor: colors.border },
                  ]}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel editing"
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
                  onPress={onSave}
                  disabled={updatingItemId === editingItem.item_id}
                  accessibilityRole="button"
                  accessibilityLabel="Save quantity"
                  accessibilityState={{
                    disabled: updatingItemId === editingItem.item_id,
                    busy: updatingItemId === editingItem.item_id,
                  }}
                >
                  {updatingItemId === editingItem.item_id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.modalButtonTextSave}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
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
    maxWidth: 400,
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
  },
  modalCloseButton: {
    padding: 4,
  },
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
    // backgroundColor set inline
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
