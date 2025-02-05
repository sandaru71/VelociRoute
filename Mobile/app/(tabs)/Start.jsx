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
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton}>
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
    width: 150,           // Adjust the width as needed
    height: 100,          // Adjust the height as needed
    marginBottom: 0,      // No gap below logo, reduces space
  },
  cycling1: {
    width: 2000,          // Adjusted width to a more reasonable size
    height: 300,        // Adjust the height as needed
    marginTop: 0,         // No gap above the cycling image
  },
  title: {
    fontSize: 32,         // Adjust the font size as needed
    fontWeight: 'bold',   // Makes the text bold
    textAlign: 'center',  // Centers the text horizontally
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
    borderColor: '#FEBE15', // Correct color formatting
    width: '80%',
    height: '8%',    
    
    borderRadius:100,// Optional padding to prevent buttons from touching edges
  },
  
  loginButton:{
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"#FEBE15",
    padding:10,
    borderRadius:100,
    width:"50%",
    
  },
  loginButtonText:{
    color:"#FFFFFF",
    flex:1,
    fontSize:20,
    fontWeight:"bold",

  },
  signupButtonText:{
    color:"#031C30",
    flex:1,
    fontSize:20,
    fontWeight:"bold",
    textAlign:"center",
    
    backgroundColor:"#FFFFFF",

  }

});
