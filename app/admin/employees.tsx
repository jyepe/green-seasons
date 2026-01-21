import React, { useEffect, useMemo, useReducer } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ThemedDropdown } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import {
  assignRestaurantToEmployee,
  getEmployeesAndRestaurants,
  type EmployeeProfile,
} from '@/lib/supabase';
import {
  employeeManagementReducer,
  initialEmployeeManagementState,
} from '@/reducers/employeeManagementReducer';

function formatEmployeeName(employee: EmployeeProfile) {
  const parts = [employee.first_name, employee.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (parts.length > 0) return parts;
  return 'Employee';
}

export default function EmployeeManagementScreen() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();

  const [state, dispatch] = useReducer(
    employeeManagementReducer,
    initialEmployeeManagementState
  );
  const {
    employeeDropdownVisible,
    restaurantDropdownVisible,
    selectedEmployeeId,
    selectedRestaurantId,
  } = state;

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['employees-and-restaurants'],
    queryFn: getEmployeesAndRestaurants,
    staleTime: 30 * 1000,
  });

  const assignMutation = useMutation({
    mutationFn: ({
      employeeId,
      restaurantId,
    }: {
      employeeId: string;
      restaurantId: string;
    }) => assignRestaurantToEmployee(employeeId, restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employees-and-restaurants'],
      });
      Alert.alert('Success', 'Restaurant assigned to employee successfully.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to assign restaurant.');
    },
  });

  const employees = useMemo(() => data?.employees ?? [], [data?.employees]);
  const restaurants = useMemo(
    () => data?.restaurants ?? [],
    [data?.restaurants]
  );
  const employeeRestaurantNames = useMemo(
    () => data?.employeeRestaurantNames ?? {},
    [data?.employeeRestaurantNames]
  );
  const employeeRestaurantIds = useMemo(
    () => data?.employeeRestaurantIds ?? {},
    [data?.employeeRestaurantIds]
  );
  const hasLoadedData = employees.length > 0 || restaurants.length > 0;
  const showErrorState = isError && !hasLoadedData;

  const selectedEmployee = useMemo(
    () =>
      employees.find(employee => employee.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );

  const selectedRestaurant = useMemo(
    () => restaurants.find(rest => rest.id === selectedRestaurantId) || null,
    [restaurants, selectedRestaurantId]
  );

  // Check if the selected restaurant is already assigned to the selected employee
  const isRestaurantAlreadyAssigned = useMemo(() => {
    if (!selectedEmployeeId || !selectedRestaurantId) return false;
    const assignedIds = employeeRestaurantIds[selectedEmployeeId] ?? [];
    return assignedIds.includes(selectedRestaurantId);
  }, [selectedEmployeeId, selectedRestaurantId, employeeRestaurantIds]);

  // Show assignment section when both employee and restaurant are selected
  const canShowAssignmentSection = selectedEmployee && selectedRestaurant;

  const handleAssignRestaurant = () => {
    if (!selectedEmployeeId || !selectedRestaurantId) return;
    assignMutation.mutate({
      employeeId: selectedEmployeeId,
      restaurantId: selectedRestaurantId,
    });
  };

  useEffect(() => {
    if (
      selectedEmployeeId &&
      !employees.find(e => e.id === selectedEmployeeId)
    ) {
      dispatch({ type: 'SELECT_EMPLOYEE', payload: null });
    }
  }, [employees, selectedEmployeeId]);

  useEffect(() => {
    if (
      selectedRestaurantId &&
      !restaurants.find(r => r.id === selectedRestaurantId)
    ) {
      dispatch({ type: 'SELECT_RESTAURANT', payload: null });
    }
  }, [restaurants, selectedRestaurantId]);

  const toggleEmployeeDropdown = () => {
    dispatch({ type: 'TOGGLE_EMPLOYEE_DROPDOWN' });
  };

  const toggleRestaurantDropdown = () => {
    dispatch({ type: 'TOGGLE_RESTAURANT_DROPDOWN' });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Employee Management
        </Text>

        <TouchableOpacity
          onPress={() => refetch()}
          style={styles.headerButton}
          accessibilityLabel="Refresh employees and restaurants"
          accessibilityRole="button"
          disabled={isLoading || isFetching}
        >
          <Ionicons
            name="refresh"
            size={22}
            color={
              isLoading || isFetching ? colors.textSecondary : colors.primary
            }
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading employees...
            </Text>
          </View>
        ) : showErrorState ? (
          <View
            style={[
              styles.errorContainer,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.errorTitle, { color: colors.error }]}>
              Unable to load employees and restaurants right now.
            </Text>
            <Text
              style={[
                styles.errorText,
                { color: colors.textSecondary, marginBottom: 12 },
              ]}
            >
              Please check your connection and try again.
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => refetch()}
              accessibilityLabel="Retry loading employees"
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.section,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Employees
              </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Select from all employee profiles pulled directly from the
                profiles table.
              </Text>

              <ThemedDropdown
                label="Employee"
                value={
                  selectedEmployee
                    ? formatEmployeeName(selectedEmployee)
                    : undefined
                }
                placeholder={
                  employees.length > 0
                    ? 'Choose an employee'
                    : 'No employees available'
                }
                isOpen={employeeDropdownVisible}
                onToggle={toggleEmployeeDropdown}
                items={employees.map(e => ({
                  id: e.id,
                  label: formatEmployeeName(e),
                }))}
                onSelect={id =>
                  dispatch({ type: 'SELECT_EMPLOYEE', payload: String(id) })
                }
                emptyMessage="No employees found."
              />

              {selectedEmployee && (
                <View
                  style={[
                    styles.selectionCard,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectionLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Selected employee
                  </Text>
                  <Text
                    style={[styles.selectionValue, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {formatEmployeeName(selectedEmployee)}
                  </Text>
                  <Text
                    style={[
                      styles.selectionLabel,
                      { color: colors.textSecondary, marginTop: 12 },
                    ]}
                  >
                    Assigned restaurants
                  </Text>
                  {employeeRestaurantNames[selectedEmployee.id]?.length > 0 ? (
                    employeeRestaurantNames[selectedEmployee.id].map(
                      (restaurantName, index) => (
                        <Text
                          key={index}
                          style={[
                            styles.selectionSubValue,
                            {
                              color: colors.text,
                              marginTop: index === 0 ? 6 : 2,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          • {restaurantName}
                        </Text>
                      )
                    )
                  ) : (
                    <Text
                      style={[
                        styles.selectionSubValue,
                        { color: colors.textSecondary, marginTop: 6 },
                      ]}
                    >
                      No restaurants assigned
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View
              style={[
                styles.section,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Restaurants
              </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Quickly browse all restaurants while managing employees.
              </Text>

              <ThemedDropdown
                label="Restaurant"
                value={selectedRestaurant?.name}
                placeholder={
                  restaurants.length > 0
                    ? 'Choose a restaurant'
                    : 'No restaurants available'
                }
                isOpen={restaurantDropdownVisible}
                onToggle={toggleRestaurantDropdown}
                items={restaurants.map(r => ({
                  id: r.id,
                  label: r.name,
                }))}
                onSelect={id =>
                  dispatch({ type: 'SELECT_RESTAURANT', payload: String(id) })
                }
                emptyMessage="No restaurants found."
              />

              {selectedRestaurant && (
                <View
                  style={[
                    styles.selectionCard,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectionLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Selected restaurant
                  </Text>
                  <Text
                    style={[styles.selectionValue, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {selectedRestaurant.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Assign Restaurant Section */}
            {canShowAssignmentSection && (
              <View
                style={[
                  styles.section,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Assign Restaurant
                </Text>
                <Text
                  style={[
                    styles.sectionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Assign the selected restaurant to the selected employee.
                </Text>

                <View
                  style={[
                    styles.assignmentSummary,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.assignmentLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Employee
                  </Text>
                  <Text
                    style={[styles.assignmentValue, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {formatEmployeeName(selectedEmployee)}
                  </Text>
                  <Text
                    style={[
                      styles.assignmentLabel,
                      { color: colors.textSecondary, marginTop: 8 },
                    ]}
                  >
                    Restaurant
                  </Text>
                  <Text
                    style={[styles.assignmentValue, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {selectedRestaurant.name}
                  </Text>
                </View>

                {isRestaurantAlreadyAssigned ? (
                  <View
                    style={[
                      styles.alreadyAssignedBanner,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.alreadyAssignedText,
                        { color: colors.text },
                      ]}
                    >
                      This restaurant is already assigned to this employee
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.assignButton,
                      { backgroundColor: colors.primary },
                      assignMutation.isPending && { opacity: 0.6 },
                    ]}
                    onPress={handleAssignRestaurant}
                    disabled={assignMutation.isPending}
                    accessibilityLabel="Assign restaurant to employee"
                    accessibilityRole="button"
                  >
                    {assignMutation.isPending ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="add-circle-outline"
                          size={20}
                          color="white"
                        />
                        <Text style={styles.assignButtonText}>
                          Assign Restaurant
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
  headerButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  errorContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  sectionDescription: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  selectionCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  selectionValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  selectionSubValue: {
    marginTop: 2,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  assignmentSummary: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  assignmentLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  assignmentValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  alreadyAssignedBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alreadyAssignedText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  assignButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
