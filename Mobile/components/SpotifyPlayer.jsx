import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Animated, Dimensions, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');
const CLIENT_ID = 'ac34709e9a3a4b6cb22db15478db926f';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const REDIRECT_URI = 'https://auth.expo.io/@sandaru71/velociroute';

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-modify-playback-state',
  'user-read-playback-state',
  'streaming',
  'playlist-read-private'
];

export default function SpotifyPlayer() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('spotify_token');
      if (token) {
        const isValid = await verifyToken(token);
        setIsAuthorized(isValid);
        if (!isValid) {
          await AsyncStorage.removeItem('spotify_token');
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyToken = async (token) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleAuth = () => {
    setError(null);
    setIsLoading(true);
    setShowWebView(true);
  };

  const handleWebViewNavigationStateChange = async (newNavState) => {
    const { url } = newNavState;
    
    if (url.includes('access_token=')) {
      const token = url.split('access_token=')[1].split('&')[0];
      await AsyncStorage.setItem('spotify_token', token);
      setIsAuthorized(true);
      setShowWebView(false);
      setIsLoading(false);
      setError(null);
    } else if (url.includes('error=')) {
      console.error('Auth error:', url);
      setError('Authentication failed');
      setShowWebView(false);
      setIsLoading(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(slideAnim, {
      toValue: isExpanded ? height : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const searchSpotify = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const token = await AsyncStorage.getItem('spotify_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.tracks?.items || []);
      setError(null);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search Spotify');
    } finally {
      setIsSearching(false);
    }
  };

  const selectTrack = (track) => {
    setCurrentTrack(track);
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#1DB954" />
        </View>
      );
    }

    if (searchResults.length === 0 && searchQuery.length > 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No songs found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.searchResults}>
        {searchResults.map((track) => (
          <TouchableOpacity
            key={track.id}
            style={styles.searchResultItem}
            onPress={() => selectTrack(track)}
          >
            <Image
              source={{ uri: track.album.images[2]?.url }}
              style={styles.searchResultImage}
            />
            <View style={styles.searchResultInfo}>
              <Text style={styles.searchResultTitle} numberOfLines={1}>
                {track.name}
              </Text>
              <Text style={styles.searchResultArtist} numberOfLines={1}>
                {track.artists.map(a => a.name).join(', ')}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const authUrl = `${SPOTIFY_AUTH_URL}?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}`;

  return (
    <>
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => {
          setShowWebView(false);
          setIsLoading(false);
        }}
      >
        <View style={styles.webViewContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowWebView(false);
              setIsLoading(false);
            }}
          >
            <Ionicons name="close" size={28} color="#1DB954" />
          </TouchableOpacity>
          <WebView
            source={{ uri: authUrl }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            style={styles.webView}
            incognito={true}
            thirdPartyCookiesEnabled={true}
          />
        </View>
      </Modal>

      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity style={styles.header} onPress={toggleExpand}>
          <View style={styles.headerContent}>
            {currentTrack ? (
              <>
                <Image source={{ uri: currentTrack.album?.images[0]?.url }} style={styles.albumArt} />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackName}>{currentTrack.name}</Text>
                  <Text style={styles.artistName}>{currentTrack.artists[0].name}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.headerText}>Spotify Player</Text>
            )}
          </View>
          <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-up'} size={24} color="#1DB954" />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {!isAuthorized ? (
              <View style={styles.authContainer}>
                {error ? (
                  <>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleAuth}>
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity 
                    style={[styles.connectButton, isLoading && styles.connectButtonDisabled]} 
                    onPress={handleAuth}
                    disabled={isLoading}
                  >
                    <Text style={styles.connectButtonText}>
                      {isLoading ? 'Connecting...' : 'Connect to Spotify'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search songs..."
                  placeholderTextColor="#808080"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    searchSpotify(text);
                  }}
                />
                {error && <Text style={styles.errorText}>{error}</Text>}
                {renderSearchResults()}
              </View>
            )}
          </View>
        )}

        {currentTrack && (
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => {}}>
              <Ionicons name="play-skip-back" size={24} color="#1DB954" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#1DB954" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}}>
              <Ionicons name="play-skip-forward" size={24} color="#1DB954" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  webViewContainer: {
    flex: 1,
    backgroundColor: '#282828',
  },
  webView: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    backgroundColor: '#282828',
    borderRadius: 20,
    padding: 5,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#282828',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: height * 0.8,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 5,
    marginRight: 10,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  artistName: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  expandedContent: {
    padding: 15,
    backgroundColor: '#282828',
  },
  authContainer: {
    alignItems: 'center',
    padding: 20,
  },
  searchContainer: {
    flex: 1,
  },
  connectButton: {
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  connectButtonDisabled: {
    backgroundColor: '#1DB95480',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4444',
    marginVertical: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#404040',
    padding: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  searchInput: {
    backgroundColor: '#404040',
    padding: 12,
    borderRadius: 8,
    color: '#fff',
    marginBottom: 15,
    fontSize: 16,
  },
  searchResults: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultArtist: {
    color: '#b3b3b3',
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#404040',
    backgroundColor: '#282828',
  },
});
