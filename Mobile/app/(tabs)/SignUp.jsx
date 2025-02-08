import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, TextInput,
} from 'react-native';
import Fontisto from '@expo/vector-icons/Fontisto';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation } from 'expo-router';

const SignUp = () => {
  const [secureEntry, setSecureEntry] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const navigation = useNavigation ();
  const handleGoBack = () =>{
    navigation.goBack();
  };
  const handleLogin = () => {
    navigation.navigate("Login");

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
      <Text style={styles.heading}>Sign Up</Text>

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Username Input */}
       

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Fontisto name="email" size={20} color="black" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your email"
            placeholderTextColor="#777"
          />
        </View>

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
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="black" />
          <TextInput
            style={styles.textInput}
            placeholder=" confirmed password"
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

        {/* Login Button */}
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
  <TouchableOpacity onPress={handleLogin
  }>
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
    borderRadius: 30, // Makes it a perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:-57,
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
    outlineStyle: 'none', // Prevents outline in web
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
    alignSelf: 'center',
  },
  fbImage:{
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
