import { Stack } from 'expo-router';

export default function EmployeeProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Profile',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Profile',
          headerBackTitle: 'Profile',
        }}
      />
    </Stack>
  );
}
