import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput,
} from 'react-native';
import Fontisto from '@expo/vector-icons/Fontisto';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from 'expo-router';

const SignUp = () => {
  const [secureEntry, setSecureEntry] = useState(true);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  

  const navigation = useNavigation();

  function handleEmail(e) {
    const emailVar = e.nativeEvent.text;
    setEmail(emailVar);

    if (!emailVar.includes('@')) {
      setEmailError('Email must contain @ symbol');
    } else if (!/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(emailVar)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  }

  function handlePasswordChange(e) {
    const newPassword = e.nativeEvent.text;
    setPassword(newPassword);
  }

  function handleConfirmPasswordChange(e) {
    const confirmPasswordVar = e.nativeEvent.text;
    setConfirmPassword(confirmPasswordVar);

    if (confirmPasswordVar !== password) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  }

  const togglePasswordVisibility = () => {
    setSecureEntry(prevState => !prevState);
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Back Button */}
      <TouchableOpacity style={styles.arrowButton} onPress={() => navigation.goBack()}>
        <AntDesign name="arrowleft" size={30} color="black" />
      </TouchableOpacity>

      {/* Heading */}
      <Text style={styles.heading}>Sign Up</Text>

      {/* Form */}
      <View style={styles.formContainer}>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Fontisto name="email" size={20} color="black" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your email"
            placeholderTextColor="#777"
            onChange={handleEmail}
          />
          {email.length > 0 && (
            emailError ? (
              <Feather name="x-circle" size={20} color="red" />
            ) : (
              <Feather name="check-circle" size={20} color="#000000" />
            )
          )}
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="black" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your password"
            placeholderTextColor="#777"
            secureTextEntry={secureEntry}
            onChange={handlePasswordChange}
          />
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Ionicons name={secureEntry ? 'eye-off' : 'eye'} size={20} color="black" />
          </TouchableOpacity>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="black" />
          <TextInput
            style={styles.textInput}
            placeholder="Confirm password"
            placeholderTextColor="#777"
            secureTextEntry={secureEntry}
            onChange={handleConfirmPasswordChange}
          />
          {confirmPassword.length > 0 && (
            passwordError ? (
              <Feather name="x-circle" size={20} color="red" />
            ) : (
              <Feather name="check-circle" size={20} color="#000000" />
            )
          )}
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Social Login Buttons */}
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="apple" size={20} color="black" />
          <Text style={styles.socialText}>Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={require('../../assets/images/facebook.jpeg')}
            style={styles.fbImage}
          />
          <Text style={styles.socialText}>Continue with Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={require('../../assets/images/googlee.jpeg')}
            style={styles.googleImage}
          />
          <Text style={styles.socialText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.signupText}>
          Already have an account?
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.signupLink}> Log in</Text>
          </TouchableOpacity>
        </Text>

      </View>
    </View>
  );
};

export default SignUp;

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
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -56,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  formContainer: {
    marginTop: 0,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 10,
    outlineStyle: 'none',
  },
  errorText: {
    color: 'red',
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
  loginText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    marginTop: 15,
    paddingHorizontal: 10,
  },
  googleImage: {
    width: 20,
    height: 20,
    marginRight: 10,
    alignSelf: 'center',
  },
  fbImage: {
    width: 20,
    height: 20,
    marginRight: 10,
    alignSelf: 'center',
  },
  socialText: {
    fontSize: 16,
    marginLeft: 10,
  },
  signupText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  signupLink: {
    color: '#FEBE15',
    fontWeight: 'bold',
  },
});
