import React, { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Platform } from 'react-native';
import { SPOTIFY_CONFIG } from '../config/api';
import axios from 'axios';

const SpotifyPlayer = () => {

  const openSpotify = async () => {
    try {
      const spotifyUrl = 'spotify://'; // This will open the Spotify app
      const supported = await Linking.canOpenURL(spotifyUrl);
      
      if (supported) {
        await Linking.openURL(spotifyUrl);
      } else {
        // If Spotify app is not installed, open Play Store
        await Linking.openURL('market://details?id=com.spotify.music');
      }
    } catch (error) {
      console.error('Error opening Spotify:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={openSpotify}>
      <MaterialCommunityIcons name="spotify" size={40} color="#1DB954" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  list: {
    flex: 1,
  },
  trackItem: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  trackInfo: {
    marginLeft: 10,
    flex: 1,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '500',
  },
  artistName: {
    fontSize: 14,
    color: '#666',
  },
  playlistItem: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playlistImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  playlistName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  playerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playerTrackName: {
    fontSize: 14,
    fontWeight: '500',
  },
  playerArtistName: {
    fontSize: 12,
    color: '#666',
  },
});

export default SpotifyPlayer;
