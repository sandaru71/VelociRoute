import React, { useState, useEffect } from "react";
import {View, Text, FlatList, Image, StyleSheet, ActivityIndicator, ScrollView, Dimensions} from 'react-native';
import MapView, {Polyline, Marker, PROVIDER_GOOGLE} from "react-native-maps";
import axios from 'axios';
import { API_URL } from '../../config/';
import { auth } from '../../firebase/config';
import { FontAwesome5 } from "@expo/vector-icons";
// import * as FileSystem from 'expo-file-system';
// import {parseString} from 'react-native-xml2js';


const {width} = Dimensions.get('window');

const activityIcons = {
    Running: 'running',
    Walking: 'walking',
    Cycling: 'bicycle',
    Hiking: 'hiking',
  };
  
  const ratingIcons = {
    Great: 'grin-beam',
    Good: 'smile',
    Average: 'meh',
    Poor: 'frown',
  };
  
  const difficultyIcons = {
    Easy: 'flag',
    Medium: 'flag-checkered',
    Hard: 'mountain',
  };

const savedActivities = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [parsedRoutes, setParsedRoutes] = useState({});

    const fetchActivities = async () => {
        try{
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No user logged in");

            const token = await currentUser.getIdToken();

            const response = await axios.get(`${API_URL}/api/activities/all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setActivities(response.data);

            const routes = {};
            for (const activity of response.data){
                if (activity.gpxUrl) {
                    const route = await parseGpxFromUrl(activity.gpxUrl);
                    routes[activity._id] = route;
                }
            }
            setParsedRoutes(routes);
        }catch (error){
            console.error('Error occurred when fetching activities: ', error.message);
        }finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);
    
    // useEffect(() => {
    //     const fetchData = async() => {
    //         try {
    //             const data = await getSavedActivities();
    //             setActivities(data);

    //             const routes = {};

    //             for (const activity of data) {
    //                 if (activity.gpxUrl) {
    //                     const route = await parseGpxFromUrl(activity.gpxUrl);
    //                     routes[activity._id] = route;
    //                 }
    //             }

    //             setParsedRoutes(routes);
    //             setLoading(false);
    //         }catch (err) {
    //             console.error('Error Loading activities: ', err);
    //             setLoading(false);
    //         }
    //     };
    //     fetchData();
    // }, []);

    const parseGpxFromUrl = async (url) => {
        try{
            const localUri = FileSystem.documentDirectory + 'temp.gpx';
            const {uri} = await FileSystem.downloadAsync(url, localUri);
            const gpxContent = await FileSystem.readAsStringAsync(uri);

            return new Promise((resolve, reject) => {
                parseString(gpxContent, (err, result) => {
                    if(err) {
                        console.error('GPX Parse Error: ', err);
                        reject(err);
                    }else{
                        try{
                            const trkpts = result.gpx.trk[0].trkseg[0].trkpt;
                            const coordinates = trkpts.map((pt) => ({
                                latitude: parseFloat(pt.$.lat),
                                longitude: parseFloat(pt.$.lon),
                            }));
                            resolve(coordinates);
                        }catch (parseErr) {
                            console.error('Error extracting coordinates: ', parseErr);
                            resolve([]);
                        }
                    }
                });
            });
        }catch(error){
            console.error('GPX file fetch error: ', error);
            return[];
        }
    };

    // const parseGPX = (gpxData) => {
    //     try {
    //         // If it's already an array of coordinates, return it
    //         if (Array.isArray(gpxData)) {
    //             return gpxData;
    //     }
    
    //     // Handle string GPX data
    //     if (typeof gpxData === 'string') {
    //         console.log('Processing GPX string:', gpxData.substring(0, 100)); // Log first 100 chars for debugging
    
    //         // Extract all trkpt elements
    //         const trackPoints = [];
    //         const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>/g;
    //         let match;
    
    //         while ((match = trkptRegex.exec(gpxData)) !== null) {
    //             const lat = parseFloat(match[1]);
    //             const lon = parseFloat(match[2]);
                
    //             if (!isNaN(lat) && !isNaN(lon)) {
    //                 trackPoints.push({
    //                 latitude: lat,
    //                 longitude: lon
    //                 }); 
    //             }   
    //         }
    
    //         console.log('Parsed track points:', trackPoints.length);
    //         return trackPoints.length > 0 ? trackPoints : null;
    //     }
    
    //         return null;
    //     } catch (error) {
    //         console.error('Error parsing GPX:', error);
    //         return null;
    //     }
    // };

    const renderMap = (coordinates) => {
        if (!coordinates || coordinates.length < 2) return null;

        const initialRegion = {
            latitude: coordinates[0].latitude,
            longitude: coordinates[0].longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }

        return(
            <MapView
                style={styles.map}
                initialRegion={initialRegion}
                scrollEnabled={false}
                zoomEnabled={false}
            >
                <Polyline coordinates={coordinates} strokeWidth={4} strokeColor="#007bff"/>

                <Marker
                    coordinate={coordinates[0]}
                    title="Start"
                    pinColor="green"
                />
                
                <Marker
                    coordinate={coordinates[coordinates.length - 1]}
                    title="End"
                    pinColor="red"
                />
            </MapView>
        );
    };

    const formatDuration = (seconds) => {
        if (!seconds && seconds !== 0) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    const formatDistance = (meters) => {
        if (!meters && meters !== 0) return 'N/A';
        const km = (meters / 1000).toFixed(2);
        return `${km} km`;
    };

    const formatSpeed = (speedMps) => {
        if (!speedMps && speedMps !== 0) return 'N/A';
        const speedKph = (speedMps * 3.6).toFixed(1); // Convert m/s to km/h
        return `${speedKph} km/h`;
    };
    
    const formatElevation = (meters) => {
        if (!meters && meters !== 0) return 'N/A';
        return `${Math.round(meters)}m`;
    };
      
    const renderImages = (images) => {
        return( 
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {images.map((img, idx) => (
                    <Image
                        key={idx}
                        source={{uri: img}}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ))}
            </ScrollView>
        )
    }

    // return (
    //     <ScrollView contentContainerStyle={styles.list}>
    //         {activities.map((activity) => {
    //             const route = parsedRoutes[activity._id] || [];

    //             return(
    //                 <View key={activity._id} style={styles.container}>
    //                     <Text style={styles.title}>{activity.title}</Text>

    //                     {route.length > 0 ? (
    //                         <MapView
    //                             style={styles.map}
    //                             initialRegion={{
    //                                 latitude: route[0].latitude,
    //                                 longitude: route[0].longitude,
    //                                 latitudeDelta: 0.01,
    //                                 longitudeDelta: 0.01,
    //                             }}
    //                             scrollEnabled={false}
    //                             zoomEnabled={false}
    //                         >
    //                             <Polyline coordinates={route} strokeColor="#007bff" strokeWidth={4}/>
    //                             <Marker coordinate={route[0]} title="Start" pinColor="green"/>
    //                             <Marker coordinate={route[route.length -1]} title="End" pinColor="red"/>
    //                         </MapView>
    //                     ) : (
    //                         <text style={styles.noRoute}>No Route Data</text>
    //                     )}

    //                     {activity.images && activity.images.length > 0 && (
    //                         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    //                             {activity.image.map((img, index) => (
    //                                 <Image key={index} source={{uri : img}} style={styles.image} />
    //                             ))}
    //                         </ScrollView>
    //                     )}
    //                 </View>
    //             );
    //         })}
    //     </ScrollView>
    // );

    const renderItem = ({item}) => (
        <View style={styles.container}>
            <Text style={styles.title}>{item.activityName}</Text>
            
            {/* Activity Type, Rating, and Difficulty */}
            <View style={styles.activityDetailsContainer}>
              {item.activityType && activityIcons[item.activityType] && (
                <View style={styles.detailItem}>
                  <FontAwesome5 name={activityIcons[item.activityType]} size={14} color="#666" />
                  <Text style={styles.detailText}>{item.activityType}</Text>
                </View>
              )}
              {item.rating && ratingIcons[item.rating] && (
                <View style={styles.detailItem}>
                  <FontAwesome5 name={ratingIcons[item.rating]} size={14} color="#666" />
                  <Text style={styles.detailText}>{item.rating}</Text>
                </View>
              )}
              {item.difficulty && difficultyIcons[item.difficulty] && (
                <View style={styles.detailItem}>
                  <FontAwesome5 name={difficultyIcons[item.difficulty]} size={14} color="#666" />
                  <Text style={styles.detailText}>{item.difficulty}</Text>
                </View>
              )}
            </View>

            {activities.map((activity) => {
                const route = parsedRoutes[activity._id] || [];

                return(
                    <View key={activity._id} style={styles.container}>
                        <Text style={styles.title}>{activity.title}</Text>

                        {route.length > 0 ? (
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    latitude: route[0].latitude,
                                    longitude: route[0].longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                            >
                                <Polyline coordinates={route} strokeColor="#007bff" strokeWidth={4}/>
                                <Marker coordinate={route[0]} title="Start" pinColor="green"/>
                                <Marker coordinate={route[route.length -1]} title="End" pinColor="red"/>
                            </MapView>
                        ) : (
                            <text style={styles.noRoute}>No Route Data</text>
                        )}

                        {activity.images && activity.images.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {activity.image.map((img, index) => (
                                    <Image key={index} source={{uri : img}} style={styles.image} />
                                ))}
                            </ScrollView>
                        )}
                    </View>
                );
            })}

            {/* images */}
            {item.images && item.images.length > 0 && renderImages(item.images)}

            {/* Map */}
            {item.routeCoordinates && item.routeCoordinates.length > 1 && renderMap(item.routeCoordinates)}

            {/* stats block */}
            {item.stats && (
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <FontAwesome5 name="clock" size={16} color="#666" />
                        <Text style={styles.statLabel}>Duration</Text>
                        <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
                    </View>

                    <View style={styles.statItem}>
                        <FontAwesome5 name="road" size={16} color="#666" />
                        <Text style={styles.statLabel}>Distance</Text>
                        <Text style={styles.statValue}>{formatDistance(item.distance)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <FontAwesome5 name="mountain" size={16} color="#666" />
                        <Text style={styles.statLabel}>Elevation</Text>
                        <Text style={styles.statValue}>{formatElevation(item.elevationGain)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <FontAwesome5 name="tachometer-alt" size={16} color="#666" />
                        <Text style={styles.statLabel}>Avg Speed</Text>
                        <Text style={styles.statValue}>{formatSpeed(item.averageSpeed)}</Text>
                    </View>
                </View>
            )}
        </View>
    );

    if(loading) {
        return(
            <View style={styles.center}>
                <ActivityIndicator size={"large"} color="#fff"/>
            </View>
        )
    }

    return(
        <FlatList
            data={activities || []}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
        />
    );
}

export default savedActivities;

const styles = StyleSheet.create({
    list: {
        padding: 12,
        paddingBottom: 50,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 6,
      },
      subtitle: {
        fontSize: 14,
        color: '#444',
      },
      description: {
        marginTop: 6,
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
      },
      imageScroll: {
        marginTop: 10,
        marginBottom: 10,
      },
      image: {
        width: width * 0.85,
        height: 200,
        marginRight: 10,
        borderRadius: 10,
      },
      mapButton: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginTop: 10,
      },
      mapButtonText: {
        color: '#fff',
        fontSize: 14,
      },
      activityDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 10,
        gap: 15,
      },
      detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#f5f5f5',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
      },
      detailText: {
        fontSize: 14,
        color: '#666',
      },
      statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        marginVertical: 10,
        paddingVertical: 15,
      },
      statItem: {
        alignItems: 'center',
      },
      statLabel: {
        fontSize:12,
        color: '#666',
        marginTop: 4,
      },
      statValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginTop: 2,
      },
      center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }
});

// export default savedActivities;