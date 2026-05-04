import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  children: React.ReactNode;
};

/**
 * Horizontal row of KpiTile children. Lays out two tiles with 10px gap and
 * 20px horizontal screen padding; designed to live directly under the
 * DashboardHeader.
 */
export function KpiRow({ children }: Props) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
