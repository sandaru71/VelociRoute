import { Image, Text, StyleSheet, View, TouchableOpacity } from 'react-native';

const Start = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"  // Ensures scaling without distortion
      />
      <Image
        source={require('../../assets/images/cycling1.jpg')}
        style={styles.cycling1}
        resizeMode="contain"  // Ensures scaling without distortion
      />
      <Text style={styles.title}>Welcome to VelociRoute</Text>
      <Text style={styles.subtitle}>
        Lorem, ipsum dolor sit amet consectetur adipisicing elit.blaaaaaaaaaaaaaaaaaaaa blaaaaaaaaaaa .
      </Text>
      <View style={styles.buttonContainer}>
        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Sign-up Button */}
        <TouchableOpacity style={styles.signupButton}>
          <Text style={styles.signupButtonText}>Sign-up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Start;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'flex-start', // Aligns content to the top
    paddingTop: 20, // Adds some top padding to the container for better spacing
  },
  logo: {
    width: 150,           
    height: 100,          
    marginBottom: 0,      
  },
  cycling1: {
    width: 2000,         
    height: 300,       
    marginTop: 0,        
  },
  title: {
    fontSize: 32,        
    fontWeight: 'bold',  
    textAlign: 'center', 
    marginVertical: 20,
    marginTop: 50,
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 90,
    borderWidth: 2,
    borderColor: '#FEBE15',
    width: '80%',
    height: '8%',    
    borderRadius: 100,
  },
  
  loginButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEBE15",  // Yellow background for login button
    padding: 10,
    borderRadius: 100,
    width: "50%",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  signupButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // White background for signup button
    padding: 10,
    borderRadius: 100,
    width: "50%",
  },
  signupButtonText: {
    color: "#031C30",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});
