import { EmployeeOrder } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { EmployeeOrderRow } from './EmployeeOrderRow';

interface EmployeeOrderListItemProps {
  order: EmployeeOrder;
}

export function EmployeeOrderListItem({ order }: EmployeeOrderListItemProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/order/[id]',
      params: { id: order.id },
    });
  };

  return (
    <EmployeeOrderRow
      order={order}
      onPress={handlePress}
      showDivider={false}
      containerStyle={styles.container}
      showChevron
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});
