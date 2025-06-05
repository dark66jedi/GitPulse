import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Alert, View, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from '../../lib/supabase';

export default function TabsLayout() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/auth/login");
    } catch (error) {
      Alert.alert("Error logging out", (error as Error).message);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#007AFF",
          headerTitle: () => (
            <Image
              source={require('../../assets/images/horizontal_icon.png')}
              style={{ width: 140, height: 40,resizeMode: 'contain' }}
            />
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
              <Ionicons name="log-out-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen
          name="people"
          options={{
            title: "Contributors",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="repos"
          options={{
            title: "Repositories",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="git-compare" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none', // make it non-interactive
  },
  footerImage: {
    width: 100,
    height: 100,
  },
});
