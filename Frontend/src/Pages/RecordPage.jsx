import React, { useState } from 'react';
import {View, Text, StyleSheet} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE } from 'react-native-maps';


const styles = StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
   });

export default function RecordPage(){
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

  return(
    <View style={styles.container}>
     <MapView
       provider={PROVIDER_GOOGLE} // remove if not using Google Maps
       style={styles.map}
       region={{
         latitude: 37.78825,
         longitude: -122.4324,
         latitudeDelta: 0.015,
         longitudeDelta: 0.0121,
       }}
     >
      {
        markersList.map((Marker)=>{
          return(
            <Marker
                key={Marker.id}
                coordinate={{latitude:Marker.latitude, longitude: Marker.longitude}}
                title={Marker.title}
                description={Marker.description}
            />
          )
        }) 
      }
     </MapView>
   </View>
  );
} 