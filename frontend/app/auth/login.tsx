// screens/Login.tsx
import { router } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Login() {
  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-center mb-8 text-black">Login</Text>

      <Text className="text-gray-700 mb-2">Email</Text>
      <TextInput
        placeholder="Enter your email"
        className="border border-gray-300 rounded-lg px-4 py-2 mb-4 text-black"
        placeholderTextColor="#999"
      />

      <Text className="text-gray-700 mb-2">Password</Text>
      <TextInput
        placeholder="Enter your password"
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-2 mb-6 text-black"
        placeholderTextColor="#999"
      />

      <TouchableOpacity className="bg-blue-600 py-3 rounded-lg mb-4">
        <Text className="text-center text-white font-bold">Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/signup')}>
        <Text className="text-center text-blue-600 font-semibold">
          Don’t have an account? Sign up
        </Text>
      </TouchableOpacity>
    </View>
  );
}
