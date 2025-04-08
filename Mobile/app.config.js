require('dotenv').config();

const version = '1.0.0';
const buildNumber = 1;

module.exports = {
  expo: {
    name: "VelociRoute",
    slug: "velociroute",
    version: version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "velociroute",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: "AIzaSyB7alGuNMvdyAk8Tb0B2jG3KjnotL4fYqo"
      },
      bundleIdentifier: "com.sandaru.dev.velociroute",
      buildNumber: buildNumber.toString()
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.sandaru.dev.velociroute",
      config: {
        googleMaps: {
          apiKey: "AIzaSyB7alGuNMvdyAk8Tb0B2jG3KjnotL4fYqo"
        }
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "INTERNET"
      ],
      versionCode: buildNumber
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow VelociRoute to use your location for route planning and road condition analysis."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'dq1hjlghb',
      CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default',
      API_URL: process.env.API_URL || 'http://13.60.171.2:3000',
      router: {
        origin: false
      },
      eas: {
        projectId: "c24e7b82-5423-4943-b58c-7964f959aed5"
      }
    },
    owner: "sandaru.dev",
    runtimeVersion: {
      policy: "sdkVersion"
    }
  }
};
