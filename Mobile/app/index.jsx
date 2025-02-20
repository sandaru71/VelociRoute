// import { View, Text } from 'react-native'
// import 'react-native-get-random-values';
// import React from 'react'
// import ColorList from '@/components/ColorList'

// const Home = () => {
//   return (
//     <View>
//       <ColorList color='#0891b2'/>
//     </View>
//   )
// }

// export default Home

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';

const SaveActivityScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.resumeText}>Resume</Text>
        <Text style={styles.saveText}>Save Activity</Text>
      </View>


      {/* Activity Name */}
      <TextInput style={styles.input} placeholder="Morning Walk" placeholderTextColor="grey"/>

      {/* Map and Photo Section */}
      <View style={styles.mapPhotoContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>This is a sample map. You'll see your activity map after saving.</Text>
        </View>
        <TouchableOpacity style={styles.photoUpload}>
          <FontAwesome5 name="image" size={24} color="black" />
          <Text style={styles.photoText}>Add Photos/Video</Text>
        </TouchableOpacity>
      </View>

      {/* Activity Description */}
      <TextInput
        style={[styles.input, styles.description]}
        placeholder="How did it go? Share more about your activity. Use @ to tag someone."
        placeholderTextColor="grey"
        multiline
      />

      {/* Activity Type */}
      <TouchableOpacity style={styles.box}>
        <FontAwesome5 name="walking" size={18} color="white" />
        <Text style={styles.dropdownText}> Walk</Text>
        <Feather name="chevron-down" size={20} color="white" style={styles.chevron} />
      </TouchableOpacity>

      

      {/* Change Map Type Button */}
      {/* <TouchableOpacity style={styles.changeMapButton}>
        <Text style={styles.changeMapText}>Change Map Type</Text>
      </TouchableOpacity> */}

      {/* Details Section */}
      <Text style={styles.detailsTitle}>Details</Text>

      {/* Type of Activity */}
      {/* <TouchableOpacity style={styles.dropdown}>
        <Feather name="activity" size={18} color="white" />
        <Text style={styles.dropdownText}> Type of activity</Text>
        <Feather name="chevron-down" size={20} color="white" style={styles.chevron} />
      </TouchableOpacity> */}

      {/* How did the activity feel? */}
      <TouchableOpacity style={styles.dropdown}>
        <FontAwesome5 name="smile" size={18} color="white" />
        <Text style={styles.dropdownText}>Rate the activity</Text>
        <Feather name="chevron-down" size={20} color="white" style={styles.chevron} />
      </TouchableOpacity>

      {/* Save Activity Button */}
      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Activity</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  resumeText: {
    color: 'black',
    fontSize: 16,
  },
  saveText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#e8e8e8',
    // color: 'black',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    marginTop:15,
  },
  description: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 0,
  },
  box:{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    
  },
  dropdownText: {
    color: 'grey',
    marginLeft: 10,
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  mapPhotoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  mapPlaceholder: {
    width: '48%',
    height: 100,
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  mapText: {
    color: 'grey',
    fontSize: 10,
    textAlign: 'center',
  },
  photoUpload: {
    width: '48%',
    height: 100,
    borderWidth: 3,
    borderColor: 'black',
    opacity: 0.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  photoText: {
    color: 'black',
    marginTop: 10,
    fontSize: 12,
  },
  changeMapButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  changeMapText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  saveButton: {
    backgroundColor: '#FEBE15',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 60,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SaveActivityScreen;
