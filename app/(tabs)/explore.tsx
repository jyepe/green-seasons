import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const categories = [
    { id: 'all', name: 'All', icon: 'grid-outline' },
    { id: 'vegetables', name: 'Vegetables', icon: 'leaf-outline' },
    { id: 'fruits', name: 'Fruits', icon: 'nutrition-outline' },
    { id: 'herbs', name: 'Herbs', icon: 'flower-outline' },
    { id: 'organic', name: 'Organic', icon: 'checkmark-circle-outline' },
  ];

  const products = [
    {
      id: '1',
      name: 'Fresh Mixed Greens',
      category: 'vegetables',
      price: '$12.99',
      unit: 'per lb',
      image: '🥬',
      description: 'Fresh, crisp mixed greens perfect for salads',
      inStock: true,
    },
    {
      id: '2',
      name: 'Organic Tomatoes',
      category: 'vegetables',
      price: '$8.99',
      unit: 'per lb',
      image: '🍅',
      description: 'Juicy, organic tomatoes from local farms',
      inStock: true,
    },
    {
      id: '3',
      name: 'Fresh Basil',
      category: 'herbs',
      price: '$4.99',
      unit: 'per bunch',
      image: '🌿',
      description: 'Aromatic fresh basil for your dishes',
      inStock: true,
    },
    {
      id: '4',
      name: 'Organic Carrots',
      category: 'vegetables',
      price: '$6.99',
      unit: 'per lb',
      image: '🥕',
      description: 'Sweet, crunchy organic carrots',
      inStock: false,
    },
    {
      id: '5',
      name: 'Fresh Strawberries',
      category: 'fruits',
      price: '$15.99',
      unit: 'per lb',
      image: '🍓',
      description: 'Sweet, ripe strawberries',
      inStock: true,
    },
    {
      id: '6',
      name: 'Organic Spinach',
      category: 'vegetables',
      price: '$7.99',
      unit: 'per lb',
      image: '🥬',
      description: 'Nutrient-rich organic spinach',
      inStock: true,
    },
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Fresh Produce
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Order the freshest ingredients for your restaurant
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.textTertiary,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              {
                backgroundColor:
                  selectedCategory === category.id
                    ? colors.primary
                    : colors.surface,
                borderColor: colors.textTertiary,
              },
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={20}
              color={
                selectedCategory === category.id ? 'white' : colors.textTertiary
              }
            />
            <Text
              style={[
                styles.categoryText,
                {
                  color:
                    selectedCategory === category.id
                      ? 'white'
                      : colors.textSecondary,
                },
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products Grid */}
      <ScrollView style={styles.productsContainer}>
        <View style={styles.productsGrid}>
          {filteredProducts.map(product => (
            <TouchableOpacity
              key={product.id}
              style={[styles.productCard, { backgroundColor: colors.surface }]}
              disabled={!product.inStock}
            >
              <View style={styles.productImage}>
                <Text style={styles.productEmoji}>{product.image}</Text>
                {!product.inStock && (
                  <View style={styles.outOfStockOverlay}>
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                  </View>
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]}>
                  {product.name}
                </Text>
                <Text
                  style={[
                    styles.productDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {product.description}
                </Text>
                <View style={styles.productPriceContainer}>
                  <Text
                    style={[styles.productPrice, { color: colors.primary }]}
                  >
                    {product.price}
                  </Text>
                  <Text
                    style={[
                      styles.productUnit,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {product.unit}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: product.inStock
                        ? colors.primary
                        : colors.textTertiary,
                    },
                  ]}
                  disabled={!product.inStock}
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  productsContainer: {
    flex: 1,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  productImage: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  productEmoji: {
    fontSize: 48,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
    lineHeight: 16,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  productUnit: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginLeft: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
});
