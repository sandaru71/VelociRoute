import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, TextInput,
} from 'react-native';
import Fontisto from '@expo/vector-icons/Fontisto';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign'; // ✅ Import AntDesign
import Feather from '@expo/vector-icons/Feather'; // ✅ Added for email verification icon
import { useNavigation } from 'expo-router';

const Login = () => {
  const [secureEntry, setSecureEntry] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setemail] = useState('');
  const [emailError, setemailError] = useState('');
 
  function handleemail(e) {
    const emailVar = e.nativeEvent.text;
    setemail(emailVar);

    if (!emailVar.includes('@')) {
      setemailError('Email must contain @ symbol'); // ❌ Show error message
    } else if (!/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(emailVar)) {
      setemailError('Invalid email format'); // ❌ Invalid format error
    } else {
      setemailError(''); // ✅ Valid email, clear error
    }
  }

 
  const navigation = useNavigation (); 
  const handleGoBack = () =>{
    navigation.goBack();

  };
  const handleSignUp = () => {
    navigation.navigate("SignUp");

  };

  // Toggle password visibility
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
      <TouchableOpacity style={styles.arrowButton} onPress={handleGoBack}>
        <AntDesign name="arrowleft" size={30} color="black" />
      </TouchableOpacity>

      {/* Heading */}
      <Text style={styles.heading}>Log in</Text>

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Fontisto name="email" size={20} color="black" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your email"
            placeholderTextColor="#777"
            onChange={e => handleemail(e)}
          />
          {email.length > 0 && (
            emailError ? (
              <Feather name="x-circle" size={20} color="#FEBE15" />
            ) : (
              <Feather name="check-circle" size={20} color="#000000" />
            )
          )}

        </View>
        {/* Email Error Message */}
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="black" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your password"
            placeholderTextColor="#777"
            
            secureTextEntry={secureEntry}
          />
          {/* Toggle Password Visibility */}
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Ionicons
              name={secureEntry ? 'eye-off' : 'eye'}
              size={20}
              color="black"
            />
          </TouchableOpacity>
        </View>

        {/* Remember Me & Forgot Password */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={styles.checkboxContainer}>
            <View style={[styles.checkbox, rememberMe && styles.checked]} />
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginText}>Log in</Text>
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

        {/* Sign Up Link */}
        <Text style={styles.signupText}>
  New to VelociRoute? 
  <TouchableOpacity onPress={handleSignUp}>
    <Text style={styles.signupLink}> Sign up</Text>
  </TouchableOpacity>
</Text>

      </View>
    </View>
  );
};

export default Login;

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

  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 5,
  },
  checked: {
    backgroundColor: '#FEBE15',
  },
  rememberText: {
    color: 'black',
    fontSize: 16,
  },
  forgotPassword: {
    color: 'black',
    fontSize: 16,
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
    paddingHorizontal: 10, // Added padding for better alignment
  },
  googleImage: {
    width: 20,
    height: 20,
    marginRight: 10,
    alignSelf: 'center', // Ensure it aligns properly in the button
  },
  fbImage:{
    width: 20,
    height: 20,
    marginRight: 10,
    alignSelf: 'center', // Ensure it aligns properly in the button
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
