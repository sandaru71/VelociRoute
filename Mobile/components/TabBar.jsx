import React from 'react';
import { View, StyleSheet } from 'react-native';
import TabBarButton from './TabBarButton';

/**
 * Custom TabBar for an Expo Router <Tabs> layout.
 *
 * @param {Object} props
 * @param {object} props.state - Navigation state containing routes, indices, etc.
 * @param {object} props.descriptors - Screen descriptors (options, etc.) for each route.
 * @param {object} props.navigation - Navigation object to handle route changes.
 */
export default function TabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      {state.routes
        .filter((route) => {
          // Exclude certain hidden/special routes
          if (route.name.startsWith('+')) return false;
          if (route.name === 'components/Avatar') return false;
          if (route.name === '_sitemap') return false;
          return true; // Keep everything else (including "feed")
        })
        .map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Retrieve the options for this route
          const { options } = descriptors[route.key];
          // Use the "title" option if available, otherwise fallback to the route name
          const label = options.title || route.name;

          return (
            <TabBarButton
              key={route.key}
              isFocused={isFocused}
              label={label}
              routeName={route.name}
              onPress={onPress}
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingVertical: 10,
  },
});
