import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const Start = () => {
  const router = useRouter();
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const position1 = useSharedValue(0);
  const position2 = useSharedValue(0);

  useEffect(() => {
    // First bubble animation
    rotation1.value = withRepeat(
      withTiming(360, { 
        duration: 30000,
        easing: Easing.linear 
      }),
      -1,
      false
    );
    
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.1, { 
          duration: 4000,
          easing: Easing.bezier(0.4, 0, 0.2, 1)
        }),
        withTiming(0.9, { 
          duration: 4000,
          easing: Easing.bezier(0.4, 0, 0.2, 1)
        })
      ),
      -1,
      true
    );

    position1.value = withRepeat(
      withSequence(
        withTiming(20, { 
          duration: 4000,
          easing: Easing.bezier(0.4, 0, 0.2, 1)
        }),
        withTiming(-20, { 
          duration: 4000,
          easing: Easing.bezier(0.4, 0, 0.2, 1)
        })
      ),
      -1,
      true
    );

    // Second bubble animation with delay
    rotation2.value = withDelay(
      1000,
      withRepeat(
        withTiming(-360, { 
          duration: 35000,
          easing: Easing.linear 
        }),
        -1,
        false
      )
    );

    scale2.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1.2, { 
            duration: 5000,
            easing: Easing.bezier(0.4, 0, 0.2, 1)
          }),
          withTiming(0.8, { 
            duration: 5000,
            easing: Easing.bezier(0.4, 0, 0.2, 1)
          })
        ),
        -1,
        true
      )
    );

    position2.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(30, { 
            duration: 5000,
            easing: Easing.bezier(0.4, 0, 0.2, 1)
          }),
          withTiming(-30, { 
            duration: 5000,
            easing: Easing.bezier(0.4, 0, 0.2, 1)
          })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation1.value}deg` },
      { scale: scale1.value },
      { translateX: position1.value },
      { translateY: position1.value }
    ],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation2.value}deg` },
      { scale: scale2.value },
      { translateX: position2.value },
      { translateY: -position2.value }
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Animated Background Circles */}
      <AnimatedGradient
        colors={['#FF6B6B', '#4ECDC4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.backgroundCircle, animatedStyle1]}
      />
      <AnimatedGradient
        colors={['#45B649', '#DCE35B']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.backgroundCircle2, animatedStyle2]}
      />

      {/* Content Container */}
      <View style={styles.contentContainer}>
        <MaterialCommunityIcons name="bike-fast" size={80} color="#fff" />
        <Text style={styles.title}>VelociRoute</Text>
        <Text style={styles.subtitle}>
          Your Ultimate Cycling Companion
        </Text>

        {/* Buttons Container */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(auth)/login')}
          >
            <LinearGradient
              colors={['#4ECDC4', '#2BAE66']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.buttonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(auth)/signup')}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </LinearGradient>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    width: height * 0.5,
    height: height * 0.5,
    borderRadius: height * 0.25,
    opacity: 0.25,
    top: -height * 0.15,
    left: -width * 0.25,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: height * 0.6,
    height: height * 0.6,
    borderRadius: height * 0.3,
    opacity: 0.25,
    bottom: -height * 0.2,
    right: -width * 0.3,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 10,
    marginBottom: 60,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 30,
    gap: 20,
  },
  button: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default Start;