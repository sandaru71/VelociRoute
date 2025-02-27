import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Reusable Input Component
const AuthInput = ({ placeholder, value, onChangeText, secureTextEntry, keyboardType }) => (
  <TextInput
    style={styles.input}
    placeholder={placeholder}
    placeholderTextColor="rgba(255, 255, 255, 0.6)"
    value={value}
    onChangeText={onChangeText}
    secureTextEntry={secureTextEntry}
    keyboardType={keyboardType}
    autoCapitalize="none"
  />
);

// Reusable Button Component
const AuthButton = ({ title, onPress, loading }) => (
  <TouchableOpacity style={[styles.button, styles.loginButton]} onPress={onPress} disabled={loading}>
    {loading ? <ActivityIndicator size="small" color="#0891b2" /> : <Text style={styles.buttonText}>{title}</Text>}
  </TouchableOpacity>
);

// Reusable Social Button Component
const SocialButton = ({ name, onPress }) => (
  <TouchableOpacity style={styles.socialButton} onPress={onPress}>
    <FontAwesome name={name} size={24} color="white" />
  </TouchableOpacity>
);

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleLogin = async () => {
    const { email, password } = form;

    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    if (!email.includes('@')) return Alert.alert('Error', 'Please enter a valid email');

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Login successful!');
      router.push('/home'); // Redirect to home page after login
    } catch (error) {
      const errorMessages = {
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
      };
      Alert.alert('Error', errorMessages[error.code] || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0891b2', '#0e7490', '#155e75']} style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="bike-fast" size={80} color="white" />
        <Text style={styles.title}>Welcome Back</Text>

        <View style={styles.form}>
          <AuthInput placeholder="Email" value={form.email} onChangeText={(value) => handleChange('email', value)} keyboardType="email-address" />
          <AuthInput placeholder="Password" value={form.password} onChangeText={(value) => handleChange('password', value)} secureTextEntry />

          <TouchableOpacity onPress={() => Alert.alert('Reset Password', 'Password reset feature coming soon')}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <AuthButton title="Login" onPress={handleLogin} loading={loading} />
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.socialButtons}>
          <SocialButton name="google" onPress={() => Alert.alert('Social Login', 'Google Login Coming Soon')} />
          <SocialButton name="facebook" onPress={() => Alert.alert('Social Login', 'Facebook Login Coming Soon')} />
          <SocialButton name="apple" onPress={() => Alert.alert('Social Login', 'Apple Login Coming Soon')} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 20, marginBottom: 40 },
  form: { width: '100%', gap: 15 },
  input: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 15, borderRadius: 12, color: 'white', fontSize: 16 },
  button: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' },
  loginButton: { backgroundColor: 'white', marginTop: 10 },
  buttonText: { fontSize: 18, fontWeight: '600', color: '#0891b2' },
  forgotPassword: { alignSelf: 'flex-end', color: 'white', fontSize: 14, marginBottom: 10 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  dividerText: { color: 'white', marginHorizontal: 10 },
  socialButtons: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  socialButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  footer: { flexDirection: 'row', marginTop: 30 },
  footerText: { color: 'rgba(255, 255, 255, 0.8)' },
  footerLink: { color: 'white', fontWeight: 'bold' },
});