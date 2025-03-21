import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome5, Feather } from '@expo/vector-icons';


const editProfile = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [location, setLocation] = useState("");
    const [selectedActivityType, setSelectedActivityType] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const activityIcons = {
      Cycling: 'bicycle',
      Running: 'running',
      Hiking: 'mountain',
      Walking: 'walking'
    };

    const activityOptions = ['Cycling', 'Running', 'Hiking', 'Walking'];

    const toggleActivityTypeModal = () => {
      setIsModalVisible(!isModalVisible);
    };

    const handleActivitySelect = (activity) => {
      setSelectedActivityType(activity);
      setIsModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>First Name</Text>
            <TextInput 
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name..."
            />
            
            <Text style={styles.label}>Last Name</Text>
            <TextInput 
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name..."
            />

            <Text style={styles.label}>Location</Text>
            <TextInput 
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City, Country"
            />
            
            <Text style={styles.label}>Select Preferred Activity</Text>
            <TouchableOpacity style={styles.dropdown} onPress={toggleActivityTypeModal}>
              {selectedActivityType && (
                  <FontAwesome5
                    name={activityIcons[selectedActivityType]}
                    size={18}
                    color="black"
                    style={styles.iconAfterText}
                  />
                )}
              <Text style={styles.dropdownText}>
                {selectedActivityType ? selectedActivityType : 'Select Activity Type'}
              </Text>
          
              <Feather name="chevron-down" size={20} color="black" style={styles.chevron} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
});