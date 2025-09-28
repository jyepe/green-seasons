import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="restaurant"
        options={{
          title: 'Create Restaurant',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
