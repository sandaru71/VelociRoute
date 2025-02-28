import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Fontisto from '@expo/vector-icons/Fontisto';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

const Login = () => {
  const [secureEntry, setSecureEntry] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

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

  const handleLogin = async () => {
    if (emailError || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields correctly');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(app)');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleSignUp = () => {
    router.push('/(auth)/signup');
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <TouchableOpacity style={styles.arrowButton} onPress={handleGoBack}>
        <AntDesign name="arrowleft" size={30} color="black" />
      </TouchableOpacity>

      <Text style={styles.heading}>Log in</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Fontisto name="email" size={20} color="black" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your email"
            placeholderTextColor="#777"
            value={email}
            onChangeText={handleEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {email.length > 0 && (
            emailError ? (
              <Feather name="x-circle" size={20} color="#FEBE15" />
            ) : (
              <Feather name="check-circle" size={20} color="#000000" />
            )
          )}
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="black" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your password"
            placeholderTextColor="#777"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureEntry}
          />
          <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)}>
            <Ionicons
              name={secureEntry ? 'eye-off' : 'eye'}
              size={20}
              color="black"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 30,
  },
  logo: {
    width: 150,
    height: 80,
    alignSelf: 'center',
  },
  arrowButton: {
    height: 36, 
    width: 44, 
    backgroundColor: '#FEBE10',
    borderRadius: 25, // Makes it a perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:-56,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 20, // Removed redundant marginBottom
  },
  formContainer: {
    marginTop: 20,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 10,
    outlineStyle: 'none', // Prevents outline in web
  },
  errorText: {
    color: '#FEBE15',
    fontSize: 14,
    marginBottom: 10,
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#FEBE15',
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 16,
  },
  signupLink: {
    fontSize: 16,
    color: '#FEBE15',
    marginLeft: 5,
  },
});

export default Login;