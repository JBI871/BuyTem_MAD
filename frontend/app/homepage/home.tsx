import { Text, View } from 'react-native';

export default function HomePage() {
  const categories = ['Electronics', 'Groceries', 'Clothing', 'Home', 'Beauty'];

  return (
    <View className="flex-1 bg-white px-6 pt-12">
      <Text className="text-4xl font-bold mb-6 text-center text-black">Welcome to BuyTem</Text>
    </View>
  );
}
