import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Modal, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getDistance, getPreciseDistance } from 'geolib';
import axios from 'axios';
import { useSpotifyAuth } from '../../../config/spotifyAuth';
import { Audio } from 'expo-av';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDvP_xQ39yqaHS74Je06nasmvEQ5ctSqK4';

export default function Record() {
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(true);
  const [intervalId, setIntervalId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const {request, response, promptAsync, checkPremiumStatus, logout, isLoggedin, premiumStatus} = useSpotifyAuth();
  const [errorMsg, setErrorMsg] = useState("");
  const [path, setPath] = useState([]);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [totalDistance, setTotalDistance] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const mapRef = useRef(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumAlert, setShowPremiumAlert] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [showDeviceAlert, setShowDeviceAlert] = useState(false);
  const [trackName, setTrackName] = useState([]);
  const [currentTrackName, setCurrentTrackName] = useState('');

  const getElevationData = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/elevation/json?locations=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0].elevation;
      }
      return null;
    } catch (error) {
      console.error('Error fetching elevation:', error);
      return null;
    }
  };

  const getElevationGain = async (newLat, newLng, lastLat, lastLng) => {
    const [newElevation, lastElevation] = await Promise.all([
      getElevationData(newLat, newLng),
      getElevationData(lastLat, lastLng)
    ]);
  
    // Update elevation if altitude changed
    if (lastElevation !== null && newElevation !== null) {
      const elevationChange = newElevation - lastElevation;
      if (elevationChange > 0) {
        setElevationGain(prev => prev + elevationChange);
      }
    }
  }

  const startLocationTracking = async () => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          const { latitude, longitude, altitude } = location.coords;
          const newLocation = { latitude, longitude, altitude };
          
          setCurrentLocation(newLocation);
          
          if (!paused) {
            setPath(prevPath => {
              if (prevPath.length === 0) {
                return [newLocation];
              }

              const lastLocation = prevPath[prevPath.length - 1];
              const distanceFromLast = getPreciseDistance(
                { latitude: lastLocation.latitude, longitude: lastLocation.longitude },
                { latitude: newLocation.latitude, longitude: newLocation.longitude }
              );

              // Only add new point if we've moved at least 1 meter
              if (distanceFromLast >= 1) {
                // Update total distance
                setTotalDistance(prevDistance => {
                  const newDistance = prevDistance + (distanceFromLast / 1000); // Convert to km
                  return newDistance;
                });

                // Calculate current speed (km/h)
                const speedInKmH = (location.coords.speed * 3.6) || 0; // Convert m/s to km/h
                setCurrentSpeed(speedInKmH);

                getElevationGain(latitude, longitude, lastLocation.latitude, lastLocation.longitude);

                return [...prevPath, newLocation];
              }
              return prevPath;
            });
          }
        }
      );
      setLocationSubscription(subscription);
    } catch (error) {
      setErrorMsg('Failed to start location tracking');
      console.error(error);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude
      });
    })();
  }, []);

  useEffect(() => {
    if (!paused) {
      startLocationTracking();
    } else if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [paused]);

  useEffect(() => {
    // Calculate average speed whenever time or distance changes
    if (time > 0) {
      const avgSpeed = (totalDistance / (time / 3600)); // km/h
      setAverageSpeed(avgSpeed);
    }
  }, [time, totalDistance]);

  useEffect(() => {
    // Check if we need to reset the tracking data
    if (params.reset === 'true') {
      resetTimer();
    }
  }, [params.reset]);

  const toggleTimer = () => {
    if (paused) {
      // Starting the timer
      const newIntervalId = setInterval(() => {
        setTime((prevTime) => {
          return prevTime + 1;
        });
      }, 1000);
      setIntervalId(newIntervalId);
    } else {
      // Pausing the timer
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setPaused(!paused);
  };

  const resetTimer = () => {
    if (!paused) {
      // Stop the timer if it's running
      clearInterval(intervalId);
      setIntervalId(null);
      setPaused(true);
    }
    // Reset all tracking data
    setTime(0);
    setPath([]);
    setTotalDistance(0);
    setElevationGain(0);
    setCurrentSpeed(0);
    setAverageSpeed(0);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600)/60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2,'0')}`;
  };

  const handleSaveActivity = () => {
    // Pause the activity before saving
    if (!paused) {
      toggleTimer();
    }
    
    console.log('Saving activity...');
    const stats = {
      duration: time,
      distance: totalDistance.toFixed(2),
      averageSpeed: averageSpeed.toFixed(2),
      elevationGain: elevationGain.toFixed(0)
    };

    router.push({
      pathname: "/(app)/post",
      params: {
        routeData: JSON.stringify(path),
        stats: JSON.stringify(stats)
      }
    });
  };

  const onRegionChangeComplete = () => {
    // When user manually moves the map, stop following
    setIsFollowingUser(false);
  };

  const zoomToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      }, 1000);
      setIsFollowingUser(true);
    }
  };

  const getActiveDevice = async () => {
    try{
      const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      console.log('Available devices: ', data.devices);

      if (!data.devices || data.devices.length === 0) {
        setShowDeviceAlert(true);
        setErrorMsg('No Spotify devices found. Please:\n1. Open Spotify on your device\n2. Play any song\n3. Try again');
        return null;
      }

      const activeDevice = data.devices.find(device => device.is_active);
      if (!activeDevice) {
        setShowDeviceAlert(true);
        setErrorMsg('No active Spotify device found. Please:\n1. Open Spotify\n2. Play any song to activate your device\n3. Try again');
        return null;
      }
      setShowDeviceAlert(false);
      return activeDevice;
    }catch(error){
      console.error('Error getting active device:', error);
      setShowDeviceAlert(true);
      setErrorMsg('Could not connect to Spotify. Please check your connection.');
      return null;
    }
  };
  
  const MusicModal = ({visible, onClose, playlists, onSelect, isLoading}) => {
    return(
      <Modal
        animationType='slide'
        transparent= {true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}> 
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Select a playlist</Text>

            {isLoading ? (
              <ActivityIndicator size="large" color="#FEBE15" />
            ) : (
              <ScrollView style={styles.playlistList}>
                {playlists.map((playlist) => (
                  <TouchableOpacity
                    key={playlist.id}
                    style={styles.playlistItem}
                    onPress={() => {
                      onSelect(playlist);
                      onClose();
                    }}
                  >
                    <Text style={styles.playlistName}>{playlist.name}</Text>
                    <Text style={styles.playlistTracks}>{playlist.tracks.total} tracks</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    )
  }

  useEffect(() => {
    if (response?.params?.access_token) {
      setAccessToken(response.params.access_token);
    }
  }, [response]);

  useEffect(() => {
    const initAudio = async () => {
      try{
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: 1,
          interruptionModeAndroid: 1,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }catch(error){
        console.error('Error initializing audio:', error);
      }
    };
    initAudio();
  }, []);

  useEffect(() => {
    if(premiumStatus === null) return;

    if(premiumStatus === true) {
      console.log('Premium status confirmed.');
      setIsPremium(true);
      setShowPremiumAlert(false);
      setErrorMsg('');
    }else{
      console.log('Non-premium account detected.');
      setIsPremium(false);
      setShowPremiumAlert(true);
      setErrorMsg('Spotify Premium is required to use the music features.');
    }
  }, [premiumStatus]);

  const handleSpotifyLogin = async () => {
    try{
      console.log('Starting Spotify login...');
      const result = await promptAsync();
      console.log('Login result:', {
        type: result?.type,
        hasCode: !!result?.params?.code,
        error: result?.error
      });

      if(result.type !== 'success'){
        console.error('Login failed:', result.error);
        setErrorMsg('Failed to login to Spotify');
      }
    } catch (error) {
      console.error('Error logging in to Spotify:', error);
      setErrorMsg('Failed to login to Spotify');
    }
  };

  const handleSpotifyLogout = async () => {
    try {
      console.log('Logging out of Spotify...');
      //if any music is playing, pauses the music first.
      if (isPlaying) {
        try{
        await pauseSong();
        } catch (error) {
          console.error('Error pausing song while logging out:', error);
        }
      }
      
      setAccessToken(null);
      setIsPremium(false);
      setIsPlaying(false);
      setCurrentTrackIndex(0);
      setPlaylistTracks([]);
      setTrackName([]);
      setCurrentTrackName('');
      setPlaylists([]);
      setSelectedPlaylist(null);
      setShowPlaylistModal(false);
      setShowDeviceAlert(false);
      setErrorMsg('');
      console.log('Successfully logged out of Spotify');
    } catch (error) {
      console.error('Error logging out of Spotify:', error);
      setErrorMsg('Failed to logout of Spotify');
    }
  };

  const playSong = async () => {
    if (!accessToken) {
      setErrorMsg('Please Login to Spotify.');
      return;
    }

    if(!isPremium){
      setShowPremiumAlert(true);
      setErrorMsg('Spotify Premium is required to use the music features.');
      return;
    }

    if (!selectedPlaylist) {
      setErrorMsg('Please select a playlist first.');
      return;
    }

    try{
      const device = await getActiveDevice();
      if(!device){
        return;
      }
      console.log('Using device: ', device.name);

      let tracks = playlistTracks;
      if (tracks.length === 0){
        tracks = await fetchPlaylistTracks(selectedPlaylist.id);
        setErrorMsg('No tracks found in playlist');
        return;
      }

      console.log('Current track index: ', currentTrackIndex);
      console.log('Total tracks:', tracks.length);
      console.log('Track URIs:', tracks);

      const safeTrackIndex = currentTrackIndex >= tracks.length ? 0 : currentTrackIndex;
      setCurrentTrackName(trackName[safeTrackIndex] || 'N/A')
      console.log('Safe track index:', safeTrackIndex);

      console.log('Attempting to play...');
      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: tracks,
          offset: { position: safeTrackIndex }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Play error:', error);
        
        if (error.error?.reason === 'NO_ACTIVE_DEVICE' ||error.error?.status === 404) {
          setShowDeviceAlert(true);
          setErrorMsg('Please open the Spotify app on your device and play any song first, then try again');
          return;
        } else {
          setShowDeviceAlert(true);
          setErrorMsg(error.error?.message || 'Failed to play song. Please try again.');
          return;
        }
      }

      setIsPlaying(true);
      if (safeTrackIndex !== currentTrackIndex) {
        setCurrentTrackIndex(safeTrackIndex);
      }
    } catch (error) {
      console.error('Error playing song:', error);
      if (!showDeviceAlert) {
        setShowDeviceAlert(true);
        setErrorMsg('Failed to play song. Make sure Spotify is open on your device.');
      }
    }
  };

  const pauseSong = async () => {
    if(!accessToken || !isPremium) return;

    try{
      const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if(!response.ok){
        const error = await response.json();
        console.error('Pause error:', error)
        throw new Error(error.error?.message || 'Failed to pause song.');
      }
      setIsPlaying(false);
    }catch (error){
      console.error('Error pausing song', error);
      setErrorMsg('Failed to pause song');
    }
  };

  const resumeSong = async () => {
    if(!accessToken || !isPremium) return;

    try{
      const device = await getActiveDevice();
      if(!device) return;

      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if(!response.ok){
        const error = await response.json();
        console.error('Resume error:', error);
        
        if (error.error?.reason === 'NO_ACTIVE_DEVICE' || error.error?.status === 404) {
          setShowDeviceAlert(true);
          setErrorMsg('No active Spotify device found. Please:\n1. Open Spotify\n2. Play any song to activate your device\n3. Try again');
          return;
        }
        throw new Error(error.error?.message || 'Failed to resume playback.');
      }
      setIsPlaying(true);
    }catch (error){
      console.error('Error resuming playback', error);
      if (!showDeviceAlert) { 
        setErrorMsg('Failed to resume playback');
        setShowDeviceAlert(true);
      }
    }
  };

  const fetchUserPlaylists = async () => {
    if(!accessToken){
      console.log('No access token available.');
      setErrorMsg('Please Login to Spotify First.');
      return;
    }
    try{
      console.log('Fetching playlists with token:', accessToken);
      setIsLoadingPlaylists(true);
      const response = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      console.log('Playlist API response:', {
        status: response.status,
        ok: response.ok,
        itemCount: data.items?.length || 0
      });

      if(!response.ok){
        throw new Error(data.error?.message || 'Failed to fetch playlists');
      }
      console.log('Fetched playlists:', data.items.length);
      setPlaylists(data.items);
      setIsLoadingPlaylists(false);
    }catch(error){
      console.error('Error fetching playlists:', error);
      setErrorMsg('Failed to fetch playlists');
      setIsLoadingPlaylists(false);
    }
  };

  const fetchPlaylistTracks = async (playlistId) => {
    try{
      console.log('Fetching tracks for playlists: ', playlistId);
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      console.log('Playlist tracks API response:', {
        status: response.status,
        ok: response.ok,
        itemCount: data.items?.length || 0
      });

      if(!response.ok){
        throw new Error(data.error?.message || 'Failed to fetch playlist tracks');
      }

      const tracks = data.items.map(item => item.track.uri);
      const names = data.items.map(item => item.track.name);
      setPlaylistTracks(tracks);
      setTrackName(names);
      return tracks;
    }catch(error){
      console.error('Error fetching playlist tracks:', error);
      setErrorMsg('Failed to fetch playlist tracks');
      return [];
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 15 }}
              onPress={() => router.push('/(app)/(tabs)/')}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <>
              {!accessToken ? (
                <TouchableOpacity 
                  style={styles.spotifyLoginButton} 
                  onPress={handleSpotifyLogin}
                >
                  <Text style={styles.spotifyLoginText}>Login to Spotify</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.spotifyLogoutButton}
                  onPress={handleSpotifyLogout}
                >
                  <Text style={styles.spotifyLogoutText}>Logout of Spotify</Text>
                </TouchableOpacity>
              )}
              

              <TouchableOpacity 
                style={[styles.saveButton, { opacity: path.length > 0 ? 1 : 0.5 }]}
                disabled={path.length === 0}
                onPress={handleSaveActivity}
              > 
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </>
          )
        }}
      />
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          showsUserLocation={true}
          followsUserLocation={isFollowingUser}
          onRegionChangeComplete={onRegionChangeComplete}
          region={
            currentLocation && isFollowingUser
              ? {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.0121,
                }
              : undefined
          }
        >
          {path.length > 0 && (
            <Polyline
              coordinates={path}
              strokeColor="#007AFF"
              strokeWidth={6}
              zIndex={1}
            />
          )}
        </MapView>

        <TouchableOpacity 
          style={[
            styles.locationButton,
            !isFollowingUser && styles.locationButtonActive
          ]}
          onPress={zoomToCurrentLocation}
        >
          <MaterialCommunityIcons 
            name="crosshairs-gps" 
            size={24} 
            color={isFollowingUser ? "#007AFF" : "#FFFFFF"} 
          />
        </TouchableOpacity>

        <View style={styles.statsOverlay}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#FEBE15" />
              <Text style={styles.statValue}>{formatTime(time)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="map-marker-distance" size={24} color="#FEBE15" />
              <Text style={styles.statValue}>{totalDistance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Distance (km)</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="speedometer" size={24} color="#FEBE15" />
              <Text style={styles.statValue}>
                {paused ? 
                  `${averageSpeed.toFixed(1)}` :
                  `${currentSpeed.toFixed(1)}`
                }
              </Text>
              <Text style={styles.statLabel}>
                {paused ? 'Average Speed (km/h)' : 'Current Speed (km/h)'}
              </Text>
            </View>

            <View style={styles.statCard}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#FEBE15" />
              <Text style={styles.statValue}>{elevationGain.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Elevation Gain (m)</Text>
            </View>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.resetButton]} 
            onPress={resetTimer}
          >
            <MaterialCommunityIcons name="refresh" size={30} color="#FF3B30" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.startButton]} 
            onPress={toggleTimer}
          >
            <MaterialCommunityIcons 
              name={paused ? "play" : "pause"} 
              size={40} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.musicControlsContainer}>
          {showPremiumAlert && (
            <View style={styles.alertContainer}>
              <Text style={styles.alertText}>
                Spotify premium is required to use the music feature.
              </Text>
            </View>
          )}

          {/* playlist selection button */}
          <TouchableOpacity 
            style={[styles.musicButton, (!accessToken || !isPremium) && styles.musicButtonDisabled]} 
            onPress={() => {
              if (accessToken && isPremium) {
                fetchUserPlaylists();
                setShowPlaylistModal(true);
              }
            }} 
            disabled={(!accessToken || !isPremium)}
          >
            <Ionicons name="musical-notes" size={35} color="#FEBE15" />
          </TouchableOpacity>

          <View style={styles.musicInfo}>
            {currentTrackName ? (
              <Text style={styles.musicText}>Now Playing: {currentTrackName}</Text>
            ) : (
              <Text style={styles.musicText}>Select a playlist to start playing</Text>
            )}
          </View>

          {/* play/pause music button */}
          <TouchableOpacity 
            style={[styles.musicButton, (!accessToken || !isPremium || !selectedPlaylist) && styles.musicButtonDisabled]} 
            onPress={isPlaying ? pauseSong : (currentTrackName ? resumeSong : playSong)} 
            disabled={(!accessToken || !isPremium || !selectedPlaylist)}
          >
            <Ionicons name={isPlaying ? "pause" : "play"} size={35} color="#FEBE15" />
          </TouchableOpacity>
        </View>

        {showDeviceAlert && (
          <View style={styles.alertContainer}>
            <Text style={styles.alertText}>{errorMsg}</Text>
            <TouchableOpacity 
              style={styles.alertButton}
              onPress={() => setShowDeviceAlert(false)}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}

        <MusicModal 
          visible={showPlaylistModal}
          onClose={() => setShowPlaylistModal(false)}
          playlists={playlists}
          onSelect={setSelectedPlaylist}
          isLoading={isLoadingPlaylists}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'black',
  },
  statsOverlay: {
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 65,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    elevation: 5,
  },
  startButton: {
    backgroundColor: '#FEBE15',
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 20,
  },
  resetButton: {
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#FEBE15',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  locationButton: {
    position: 'absolute',
    right: 20,
    bottom: 70,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locationButtonActive: {
    backgroundColor: '#007AFF',
  },
  spotifyLoginButton: {
    backgroundColor: '#FEBE15',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 15,
  },
  spotifyLoginText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  musicControlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  spotifyLogoutButton: {
    backgroundColor: '#FEBE15',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 15,
  },
  spotifyLogoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
  },
  alertText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  playlistList: {
    width: '100%',
  },
  playlistItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
  },
  playlistTracks: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  selectedPlaylistContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedPlaylistText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  musicButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 25,
    marginHorizontal: 5,

  },
  musicButtonDisabled: {
    opacity: 0.5,
  },
  alertContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertText: {
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  alertButton: {
    backgroundColor: '#FEBE15',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  alertButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  musicText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
