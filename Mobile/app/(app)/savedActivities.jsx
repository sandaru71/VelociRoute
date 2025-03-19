import React, { useState, useEffect } from "react";
import {View, Text, FlatList, Image, StyleSheet, ActivityIndicator, ScrollView} from 'react-native';
import axios from 'axios';
import { API_URL } from '../../config';
import { auth } from '../../firebase/config';

const savedActivities = ({userToken}) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivities = async () => {
        try{
            const response = await axios.get(`${API_URL}/api/activities/all`, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });
            setActivities(response.data);
        }catch (error){
            console.error('Error occurred when fetching activities: ', error.message);
        }finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const renderImages = (images) => {
        return(
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

    const renderItem = ({item}) => (
        <View>
            <Text>{item.activityName}</Text>
            <Text>Type: {item.activityType}</Text>
            <Text>Rating: {item.rating}</Text>
            <Text>Difficulty: {item.difficulty}</Text>

            {/* images */}
            {item.images && item.images.length > 0 && renderImages(item.images)}

            {/* stats block */}
            {item.stats && (
                <View style={styles.statsContainer}>
                    {item.stats.distance && <Text>Distance: {item.stats.distance} km</Text>}
                    {item.stats.avgSpeed && <Text>Avg Speed: {item.stats.avgSpeed} km/h</Text>}
                    {item.stats.elevation && <Text>Elevation Gain: {item.stats.elevation} m</Text>}
                </View>
            )}
        </View>
    );

    if(loading) {
        return(
            <View>
                <ActivityIndicator size={"large"} color="#fff"/>
            </View>
        )
    }

    return(
        <FlatList
            data={activities}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
        />
    );
};

const styles = StyleSheet.create({

})