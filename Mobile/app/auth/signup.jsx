import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

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
  <TouchableOpacity style={[styles.button, styles.signupButton]} onPress={onPress} disabled={loading}>
    {loading ? <ActivityIndicator size="small" color="#0891b2" /> : <Text style={styles.buttonText}>{title}</Text>}
  </TouchableOpacity>
);

// Reusable Social Button Component
const SocialButton = ({ name, onPress }) => (
  <TouchableOpacity style={styles.socialButton} onPress={onPress}>
    <FontAwesome name={name} size={24} color="white" />
  </TouchableOpacity>
);

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSignUp = async () => {
    const { name, email, password, confirmPassword } = form;

    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert('Error', 'Please fill in all fields');
    }
    if (!email.includes('@')) {
      return Alert.alert('Error', 'Please enter a valid email');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    if (password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/auth/login')
        }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0891b2', '#0e7490', '#155e75']} style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="bike-fast" size={80} color="white" />
        <Text style={styles.title}>Create Account</Text>

        <View style={styles.form}>
          <AuthInput placeholder="Full Name" value={form.name} onChangeText={(value) => handleChange('name', value)} />
          <AuthInput placeholder="Email" value={form.email} onChangeText={(value) => handleChange('email', value)} keyboardType="email-address" />
          <AuthInput placeholder="Password" value={form.password} onChangeText={(value) => handleChange('password', value)} secureTextEntry />
          <AuthInput placeholder="Confirm Password" value={form.confirmPassword} onChangeText={(value) => handleChange('confirmPassword', value)} secureTextEntry />

          <AuthButton title="Sign Up" onPress={handleSignUp} loading={loading} />
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.socialButtons}>
          <SocialButton name="google" onPress={() => Alert.alert('Social Sign Up', 'Google Sign-Up Coming Soon')} />
          <SocialButton name="facebook" onPress={() => Alert.alert('Social Sign Up', 'Facebook Sign-Up Coming Soon')} />
          <SocialButton name="apple" onPress={() => Alert.alert('Social Sign Up', 'Apple Sign-Up Coming Soon')} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.footerLink}>Login</Text>
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
  form: { width: '100%', marginVertical: 10 }, // Fixed spacing
  input: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 15, borderRadius: 12, color: 'white', fontSize: 16 },
  button: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' },
  signupButton: { backgroundColor: 'white', marginTop: 10 },
  buttonText: { fontSize: 18, fontWeight: '600', color: '#0891b2' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  dividerText: { color: 'white', marginHorizontal: 10 },
  socialButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  socialButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  footer: { flexDirection: 'row', marginTop: 30 },
  footerText: { color: 'rgba(255, 255, 255, 0.8)' },
  footerLink: { color: 'white', fontWeight: 'bold' },
});