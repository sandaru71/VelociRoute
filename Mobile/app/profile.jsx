import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { COLORS, images, FONTS, SIZES } from "../constants";

const Profile = () => {

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.white,
      }}
    >
      <StatusBar backgroundColor={COLORS.gray} />

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {/* Cover Image */}
        <View style={{ width: "100%" }}>
          <Image
            source={images.profileBackground}
            resizeMode="cover"
            style={{
              height: 228,
              width: "100%",
            }}
          />
        </View>

        {/* Profile Section */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Image
            source={images.profilePhoto}
            resizeMode="cover"
            style={{
              height: 155,
              width: 155,
              borderRadius: 999,
              borderColor: COLORS.primary,
              borderWidth: 2,
              marginTop: -90,
            }}
          />

          <Text
            style={{
              ...FONTS.h3,
              color: COLORS.black,
              marginVertical: 8,
              fontWeight: "bold",
            }}
          >
            Melissa Peters
          </Text>
          <Text
            style={{
              color: COLORS.black,
              ...FONTS.body4,
              fontFamily:'Arial'
            }}
          >
            Cyclist
          </Text>

          {/* Location */}
          <View
            style={{
              flexDirection: "row",
              marginVertical: 6,
              alignItems: "center",
            }}
          >
            <MaterialIcons name="location-on" size={24} color="black" />
            <Text
              style={{
                ...FONTS.body4,
                marginLeft: 4,
                fontFamily:'Arial'
              }}
            >
              Dehiwala, Colombo
            </Text> 
          </View>

          {/* Stats Section */}
          <View
            style={{
              flex: 1,
              paddingVertical: 8,
              flexDirection: "row",
            }}
          >
            {/* Followers */}
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                marginHorizontal: SIZES.padding,
              }}
            >
              <Text
                style={{
                  ...FONTS.h2,
                  color: COLORS.black,
                }}
              >
                10
              </Text>
              <Text
                style={{
                  ...FONTS.body4,
                  color: COLORS.black,
                  fontWeight:'bold',
                }}
              >
                Followers
              </Text>
            </View>

            {/* Followings */}
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                marginHorizontal: SIZES.padding,
              }}
            >
              <Text
                style={{
                  ...FONTS.h2,
                  color: COLORS.black,
                }}
              >
                6
              </Text>
              <Text
                style={{
                  ...FONTS.body4,
                  color: COLORS.black,
                  fontWeight:'bold',
                }}
              >
                Followings
              </Text>
            </View>

            {/* Likes */}
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                marginHorizontal: SIZES.padding,
              }}
            >
              <Text
                style={{
                  ...FONTS.h2,
                  color: COLORS.black,
                }}
              >
                5
              </Text>
              <Text
                style={{
                  ...FONTS.body4,
                  color: COLORS.black,
                  fontWeight:'bold',
                }}
              >
                Activities
              </Text>
            </View>
          </View>

          {/* Buttons Section */}
          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <TouchableOpacity
              style={{
                width: 124,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.primary,
                borderRadius: 10,
                marginHorizontal: SIZES.padding,
              }}
            >
              <Text
                style={{
                  ...FONTS.body4,
                  color: COLORS.black,
                  fontWeight: "bold",
                }}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: 124,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.primary,
                borderRadius: 10,
                marginHorizontal: SIZES.padding,
              }}
            >
              <Text
                style={{
                  ...FONTS.body4,
                  color: COLORS.black,
                  fontWeight: "bold",
                }}
              >
                Add Friend
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Section */}
          <View
            style={{
              marginTop: 20,
              backgroundColor: COLORS.primary,
              width: "70%",
              padding: 12,
              borderRadius: 25,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                color: COLORS.black,
                textAlign: "center",
                marginBottom: 10,
                fontWeight: "bold",
                fontFamily:'Arial'
              }}
            >
              Stats
            </Text>

            {/* Last 4 Weeks */}
            <View
              style={{
                borderBottomColor: COLORS.black,
                borderBottomWidth: 2,
                paddingBottom: 20,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...FONTS.body5, color: COLORS.black, fontWeight: "bold", paddingBottom: 8 }}>
                  Last 4 Weeks
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingLeft: 20 }}>Activity / Week</Text>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingRight: 20 }}>00</Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingLeft: 20 }}>Avg Distance / Week</Text>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingRight: 20 }}>00</Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingLeft: 20 }}>Avg Time / Week</Text>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingRight: 20 }}>00</Text>
              </View>
            </View>

            {/* All-Time */}
            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...FONTS.body5, color: COLORS.black, fontWeight: "bold", paddingBottom: 8, paddingTop: 12 }}>
                  All-Time
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingLeft: 20 }}>Activities</Text>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingRight: 20 }}>00</Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingLeft: 20 }}>Distance</Text>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingRight: 20 }}>00</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingLeft: 20 }}>Elev Gain</Text>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingRight: 20 }}>00</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingLeft: 20 }}>Time</Text>
                <Text style={{ ...FONTS.body4, color: COLORS.black, paddingRight: 20 }}>00</Text>
              </View>
            </View>
          </View>

          {/* Calendar Section */}
          <View style={{ marginTop: 40, width: "70%", borderRadius: 15, overflow: "hidden" }}>
            <Text
              style={{
                fontSize: 20,
                color: COLORS.black,
                textAlign: "center",
                fontWeight: "bold",
                marginBottom: 10,
                fontFamily:'Arial',
              }}
            >
              Activity Calendar
            </Text>
            <Calendar
              current={"2025-02-01"}
              markedDates={{
                "2025-02-06": { selected: true, marked: true, selectedColor: COLORS.primary },
              }}
              theme={{
                backgroundColor: COLORS.white,
                calendarBackground: COLORS.gray,
                todayTextColor: COLORS.primary,
                arrowColor: COLORS.primary,
                textSectionTitleColor: COLORS.black,
                dayTextColor: COLORS.black,
                monthTextColor: COLORS.black,
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
