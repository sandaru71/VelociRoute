import React, { useState, useEffect, useLayoutEffect } from 'react';
import {View, Text, StyleSheet, Button, TouchableOpacity} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { Ionicons} from '@expo/vector-icons';

export default function Record(){
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(true);
  const [intervalId, setIntervalId] = useState(null);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={{marginLeft: 15}}
          onPress={() => navigation.navigate('index')}
        >
          <Ionicons name="arrow-back" size={24} color="black"/>
        </TouchableOpacity>  
      ),
    });
  }, [navigation]);

  const [markersList, setMarkersList] = useState([
    {
      id:1,
      latitude:24.794446,
      longitude:67.057423,
      title:'I am here',
      description:'This is my current location'
    },
    {
      id:2,
      latitude:24.833368,
      longitude:67.048489,
      title:'Team B',
      description:'This is Team B\'s current location'
    }
  ])

  const toggleTimer = () => {
    if (paused) {
      const newIntervalId = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
      setIntervalId(newIntervalId);
    } else {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setPaused(!paused);
  };

  const resetTimer = () => {
    clearInterval(intervalId);
    setTime(0);
    setPaused(true);
    setIntervalId(null);
  };

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  return(
    <View style={styles.container}>
      {/* Timer Display */}
      <View style={styles.timeContainer}>
        <Text style={styles.timerText}>Time: {time}s</Text>
      </View>

     <MapView
       provider={PROVIDER_GOOGLE} // remove if not using Google Maps
       style={styles.map}
       region={{
         latitude: 24.833368,
         longitude: 67.048489,
         latitudeDelta: 0.015,
         longitudeDelta: 0.0121,
       }}
     >
      {
        markersList.map((marker)=>{
          return(
            <Marker
                key={marker.id}
                coordinate={{latitude:marker.latitude, longitude: marker.longitude}}
                title={marker.title}
                description={marker.description}
            />
          )
        }) 
      }
     </MapView>

     {/* Button to start/pause the timer */}
     <View style={styles.buttonContainer}>
      <Button title={paused ? 'Start' : 'Pause'}
      onPress = {toggleTimer}
      />
      <Button title='Reset' onPress={resetTimer} color="red"/>
     </View>
   </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  timeContainer: {
    position: 'absolute',
    zIndex: 1,
    top: 40,
    backgroundColor: '#FEBE15',
    padding:10,
    borderRadius: 5,
  },
  timerText: {
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer:{
    position: 'absolute',
    bottom: 150,
    backgroundColor: 'black',
    padding:20,
    zIndex:1,
    borderRadius: 5,
  },
 });


