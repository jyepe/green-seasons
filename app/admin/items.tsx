import { ItemFormModal } from '@/components/admin/ItemFormModal';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  useAdminItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from '@/hooks/useAdminItems';
import { Item, CreateItemParams, UpdateItemParams } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ITEMS_PER_PAGE = 10;

export default function AdminItemsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const { data: items, isLoading } = useAdminItems();
  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const deleteItemMutation = useDeleteItem();

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        (item.description &&
          item.description.toLowerCase().includes(query)) ||
        item.unit.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedItems = filteredItems.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const hasPrevious = safePage > 1;
  const hasNext = safePage < totalPages;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleAddItem = () => {
    setEditingItem(null);
    setIsFormModalVisible(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setIsFormModalVisible(true);
  };

  const handleDeleteItem = (item: Item) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItemMutation.mutateAsync(item.id);
              Alert.alert('Success', 'Item deleted successfully.');
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Failed to delete item. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleSaveItem = async (
    data: CreateItemParams | UpdateItemParams
  ) => {
    try {
      if (editingItem) {
        // Update existing item
        await updateItemMutation.mutateAsync({
          itemId: editingItem.id,
          params: data as UpdateItemParams,
        });
        Alert.alert('Success', 'Item updated successfully.');
      } else {
        // Create new item
        await createItemMutation.mutateAsync(data as CreateItemParams);
        Alert.alert('Success', 'Item created successfully.');
      }
      setIsFormModalVisible(false);
      setEditingItem(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : editingItem
            ? 'Failed to update item. Please try again.'
            : 'Failed to create item. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const isLoadingMutation =
    createItemMutation.isPending ||
    updateItemMutation.isPending ||
    deleteItemMutation.isPending;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Item Management
        </Text>
        <TouchableOpacity
          onPress={handleAddItem}
          style={styles.addButton}
          accessibilityLabel="Add new item"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search items..."
          placeholderTextColor={colors.textSecondary + '80'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Items List */}
      <ScrollView
        style={styles.itemsContainer}
        contentContainerStyle={styles.itemsContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !items ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading items...
            </Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={searchQuery ? 'search-outline' : 'cube-outline'}
              size={64}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              {searchQuery ? 'No Items Found' : 'No Items'}
            </Text>
            <Text
              style={[styles.emptyStateText, { color: colors.textSecondary }]}
            >
              {searchQuery
                ? `No items match "${searchQuery}".`
                : 'Get started by adding your first item.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[
                  styles.addFirstButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleAddItem}
              >
                <Text style={styles.addFirstButtonText}>Add Item</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.listContent}>
            {paginatedItems.map(item => (
              <ItemListItem
                key={item.id}
                item={item}
                colors={colors}
                onEdit={() => handleEditItem(item)}
                onDelete={() => handleDeleteItem(item)}
                isDeleting={deleteItemMutation.isPending}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Pagination */}
      {!isLoading && filteredItems.length > 0 && (
        <View
          style={[
            styles.paginationContainer,
            { borderColor: colors.textTertiary },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.paginationButton,
              { backgroundColor: colors.surface },
              !hasPrevious && styles.paginationButtonDisabled,
            ]}
            onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={!hasPrevious}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={!hasPrevious ? colors.textTertiary : colors.text}
            />
          </TouchableOpacity>
          <Text
            style={[styles.paginationLabel, { color: colors.textSecondary }]}
          >
            Page {safePage} of {totalPages}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              { backgroundColor: colors.surface },
              !hasNext && styles.paginationButtonDisabled,
            ]}
            onPress={() =>
              setCurrentPage(prev => Math.min(prev + 1, totalPages))
            }
            disabled={!hasNext}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={!hasNext ? colors.textTertiary : colors.text}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Form Modal */}
      <ItemFormModal
        visible={isFormModalVisible}
        item={editingItem}
        isLoading={isLoadingMutation}
        onClose={() => {
          setIsFormModalVisible(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />
    </SafeAreaView>
  );
}

type ItemListItemProps = {
  item: Item;
  colors: (typeof Colors)['light'];
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

function ItemListItem({
  item,
  colors,
  onEdit,
  onDelete,
  isDeleting,
}: ItemListItemProps) {
  return (
    <View
      style={[
        styles.itemCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.itemImagePlaceholder,
            { backgroundColor: colors.background },
          ]}
        >
          <Ionicons
            name="image-outline"
            size={32}
            color={colors.textTertiary}
          />
        </View>
      )}

      <View style={styles.itemContent}>
        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description && (
          <Text
            style={[styles.itemDescription, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
        <View style={styles.itemFooter}>
          <Text style={[styles.itemPrice, { color: colors.primary }]}>
            ${item.price.toFixed(2)}
          </Text>
          <Text style={[styles.itemUnit, { color: colors.textSecondary }]}>
            / {item.unit}
          </Text>
        </View>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.editButton,
            { backgroundColor: colors.primary + '20' },
          ]}
          onPress={onEdit}
          disabled={isDeleting}
        >
          <Ionicons name="pencil" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.deleteButton,
            { backgroundColor: colors.error + '20' },
          ]}
          onPress={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Ionicons name="trash" size={18} color={colors.error} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  addButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  clearButton: {
    padding: 4,
  },
  itemsContainer: {
    flex: 1,
  },
  itemsContent: {
    paddingBottom: 24,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter_600SemiBold',
  },
  itemCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  itemUnit: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginLeft: 4,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    // backgroundColor set inline
  },
  deleteButton: {
    // backgroundColor set inline
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
