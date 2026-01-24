import {
  OrderListItem,
  FilterStatus,
  OrderListLayout,
} from '@/components/OrderListItem';
import { useOrders } from '@/hooks/useOrders';
import { useUserInfo } from '@/hooks/useUserInfo';
import React, { useMemo, useState } from 'react';

export default function OrderHistoryScreen() {
  const { data: userInfo } = useUserInfo();
  const { data: orders = [], isLoading } = useOrders(userInfo?.id);

  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') {
      return orders;
    }
    return orders.filter(order => order.status === activeFilter);
  }, [orders, activeFilter]);

  return (
    <OrderListLayout
      title="Order History"
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      isLoading={isLoading}
      data={filteredOrders}
      renderItem={({ item }) => <OrderListItem order={item} />}
      keyExtractor={item => item.id}
    />
  );
}
