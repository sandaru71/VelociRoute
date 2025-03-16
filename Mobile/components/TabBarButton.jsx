import { View, Text, Pressable, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import { icons } from '../assets/icons'; // Ensure this import is correct
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const TabBarButton = (props) => {
    const { isFocused, label, routeName, color = isFocused ? 'blue' : 'gray' } = props;

    // Debugging: Log the routeName and icons object
    console.log("Route Name:", routeName);
    console.log("Icons Object:", icons);

    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(
            isFocused ? 1 : 0,
            { duration: 350 }
        );
    }, [scale, isFocused]);

    const animatedIconStyle = useAnimatedStyle(() => {
        const scaleValue = interpolate(
            scale.value,
            [0, 1],
            [1, 1.4]
        );
        const top = interpolate(
            scale.value,
            [0, 1],
            [0, 8]
        );

        return {
            transform: [{ scale: scaleValue }],
            top,
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scale.value,
            [0, 1],
            [1, 0]
        );

        return {
            opacity,
        };
    });

    // Ensure the routeName exists in the icons object
    const IconComponent = icons[routeName];

    if (!IconComponent || typeof IconComponent !== 'function') {
        console.error(`No icon found for routeName: ${routeName}`);
        return null; // Return null or a fallback component if the icon is not found
    }

    return (
        <Pressable {...props} style={styles.container}>
            <Animated.View style={[animatedIconStyle]}>
                <IconComponent color={color} />
            </Animated.View>
            
            <Animated.Text style={[{ 
                color,
                fontSize: 11,
            }, animatedTextStyle]}>
                {label}
            </Animated.Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
});

export default TabBarButton;