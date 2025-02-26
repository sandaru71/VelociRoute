import { View, Text, Pressable, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import { icons } from '../assets/icons';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const TabBarButton = (props) => {
    const {isFocused, options, route, color = '#0891b2'} = props;
    const label = options?.title ?? route.name;

    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(
            typeof isFocused === 'boolean' ? (isFocused ? 1 : 0) : isFocused,
            {duration: 350}
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
            transform: [{scale: scaleValue}],
            top
        }
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scale.value,
            [0, 1],
            [1, 0]
        );

        return {
            opacity
        }
    });

    const Icon = icons[route.name];

    if (!Icon) {
        console.warn(`No icon found for route: ${route.name}`);
        return null;
    }

    return (
        <Pressable {...props} style={styles.container}>
            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                <Icon color={isFocused ? color : '#737373'} />
            </Animated.View>
            <Animated.Text style={[
                styles.label,
                animatedTextStyle,
                {color: isFocused ? color : '#737373'}
            ]}>
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
        height: 50,
    },
    iconContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        textAlign: 'center',
        position: 'absolute',
        bottom: 0,
    }
});

export default TabBarButton;