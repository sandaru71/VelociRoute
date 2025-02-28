import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const getIconName = (routeName) => {
  switch (routeName) {
    case 'home':
      return 'home';
    case 'planner':
      return 'calendar';
    case 'record':
      return 'recording';
    case 'feed':
      return 'list';
    case 'profile':
      return 'person';
    default:
      return 'help-circle';
  }
};

const TabBar = ({ state, descriptors, navigation }) => {
  const primaryColor = '#0891b2';
  const greyColor = '#737373';

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        if (['_sitemap', '+not-found'].includes(route.name)) return null;

        const isFocused = state.index === index;
        const iconName = getIconName(route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tabButton, isFocused && styles.focused]}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isFocused ? primaryColor : greyColor}
            />
            <Text style={[styles.tabText, isFocused && styles.focusedText]}>
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  focused: {
    backgroundColor: '#f1f5f9',
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: '#64748b',
  },
  focusedText: {
    color: '#0891b2',
  },
});

export default TabBar;
