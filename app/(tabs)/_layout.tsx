import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Alert, View, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function TabsLayout() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.text + '80',
          tabBarStyle: {
            backgroundColor: theme.colors.tabBarBackground,
            borderTopColor: theme.colors.border,
          },
          headerStyle: {
            backgroundColor: theme.colors.headerBackground,
          },
          headerTintColor: theme.colors.text,
          headerShadowVisible: true,
          headerTitle: () => (
            <Image
              source={isDark 
                ? require('../../assets/images/horizontal_icon_white.png')
                : require('../../assets/images/horizontal_icon.png')
              }
              style={styles.headerImage}
            />
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <ThemeToggle />
              <TouchableOpacity 
                onPress={handleLogout} 
                style={styles.logoutButton}
                accessibilityLabel="Logout"
                accessibilityHint="Tap to sign out of your account"
              >
                <Ionicons 
                  name="log-out-outline" 
                  size={24} 
                  color={theme.colors.primary} 
                />
              </TouchableOpacity>
            </View>
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
  container: {
    flex: 1,
  },
  headerImage: {
    width: 140,
    height: 40,
    resizeMode: 'contain',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutButton: {
    padding: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  footerImage: {
    width: 100,
    height: 100,
  },
});