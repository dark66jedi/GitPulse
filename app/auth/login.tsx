import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { theme } from '../../lib/theme';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import * as AuthSession from 'expo-auth-session';

const redirectTo = AuthSession.makeRedirectUri({
  native: 'gitpulse://auth',
});

const signInWithGitHub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo },
  });

  if (error) console.error("OAuth login error:", error);
};

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Login</Text>

      <TouchableOpacity style={styles.githubButton} onPress={signInWithGitHub}>
        <FontAwesome name="github" size={24} color="white" style={{ marginRight: 10 }} />
        <Text style={styles.buttonText}>Sign in with GitHub</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 32,
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 16,
  },
});
