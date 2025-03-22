import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { icons } from '../assets/icons';  // or wherever your icons are defined
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export default function TabBarButton({
  isFocused,
  label,
  routeName,
  color = isFocused ? 'blue' : 'gray',
  onPress,
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, { duration: 350 });
  }, [isFocused, scale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scale.value, [0, 1], [1, 1.4]),
      },
    ],
    top: interpolate(scale.value, [0, 1], [0, 8]),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scale.value, [0, 1], [1, 0]),
  }));

  // Fallback: if no icon found, do nothing or show default
  const IconComponent = icons[routeName] || null;

  return (
<<<<<<< HEAD
    <Pressable onPress={onPress} style={styles.container}>
      {IconComponent && (
        <Animated.View style={animatedIconStyle}>
          <IconComponent color={color} />
=======
    <Pressable {...props} style={styles.container}>
        <Animated.View style={[animatedIconStyle]}>
            {
                icons[routeName] 
                ? icons[routeName]({ color }) 
                : null 
            }
>>>>>>> 88677a46cfe6b31fc65727a61632357378f514d7
        </Animated.View>
      )}
      <Animated.Text style={[{ color, fontSize: 11 }, animatedTextStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
});
