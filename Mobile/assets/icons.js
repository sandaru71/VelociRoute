// icons.js
import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

export const icons = {
  index:    ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
  planner:  ({ color }) => <MaterialIcons name="event" size={24} color={color} />,
  feed:     ({ color }) => <FontAwesome   name="rss" size={24} color={color} />,
  record:   ({ color }) => <FontAwesome   name="video-camera" size={24} color={color} />,
  profile:  ({ color }) => <FontAwesome   name="user" size={24} color={color} />,
};
