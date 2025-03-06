import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

const { width, height } = Dimensions.get('window');
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const [secureConfirmEntry, setSecureConfirmEntry] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000 }),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 3000 }),
        withTiming(0.9, { duration: 3000 }),
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const handleEmail = (text) => {
    setEmail(text);
    if (!text.includes('@')) {
      setEmailError('Email must contain @ symbol');
    } else if (!/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(text)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  };

  const handleSignUp = async () => {
    if (emailError || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields correctly');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <AnimatedGradient
        colors={['#52B788', '#95D5B2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.backgroundGradient, animatedStyle]}
      />
      <AnimatedGradient
        colors={['#00B4D8', '#90E0EF']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.backgroundGradient2, animatedStyle]}
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <MaterialCommunityIcons name="bike-fast" size={60} color="#fff" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the cycling community</Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="email-outline" size={24} color="#FFFFFF" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#FFFFFF80"
              value={email}
              onChangeText={handleEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-outline" size={24} color="#FFFFFF" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#FFFFFF80"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureEntry}
            />
            <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)}>
              <Ionicons
                name={secureEntry ? 'eye-off' : 'eye'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-check-outline" size={24} color="#FFFFFF" />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#FFFFFF80"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={secureConfirmEntry}
            />
            <TouchableOpacity onPress={() => setSecureConfirmEntry(!secureConfirmEntry)}>
              <Ionicons
                name={secureConfirmEntry ? 'eye-off' : 'eye'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signupButton, loading && styles.signupButtonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <LinearGradient
            colors={['#00B4D8', '#90E0EF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  backgroundGradient: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 0.6,
    borderRadius: height * 0.3,
    top: -height * 0.3,
    right: -width * 0.25,
    opacity: 0.3,
  },
  backgroundGradient2: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 0.6,
    borderRadius: height * 0.3,
    bottom: -height * 0.3,
    left: -width * 0.25,
    opacity: 0.3,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF80',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    gap: 20,
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF15',
    borderRadius: 15,
    padding: 15,
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    marginTop: 5,
    marginLeft: 15,
  },
  signupButton: {
    width: '100%',
    height: 55,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  loginText: {
    color: '#FFFFFF80',
    fontSize: 16,
  },
  loginLink: {
    color: '#00B4D8',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignUp;