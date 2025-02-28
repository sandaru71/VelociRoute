import { useRouter } from 'expo-router'; 
import { Image, Text, StyleSheet, View, TouchableOpacity } from 'react-native';

const Start = () => {
  const router = useRouter();
  
  const handleLogin = () => {
    router.push('/(auth)/login');
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
      <Image
        source={require('../../assets/images/cycling1.jpg')}
        style={styles.cycling1}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome to VelociRoute</Text>
      <Text style={styles.subtitle}>
        Plan your perfect ride, hike, or exploration with AI-powered route optimization. Discover. Ride. Explore. Let's get started! 🚀
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
          <Text style={styles.signupButtonText}>Sign-up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
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
    marginTop: 80,
    borderWidth: 2,
    borderColor: '#FEBE15',
    width: '80%',
    height: '8%',
    borderRadius: 100,
  },
  loginButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEBE15',
    padding: 10,
    borderRadius: 100,
    width: '50%',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  signupButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 100,
    width: '50%',
  },
  signupButtonText: {
    color: '#031C30',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Start;