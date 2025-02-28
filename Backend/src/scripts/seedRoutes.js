require('dotenv').config();
const connectDB = require('../Infrastructure/db');

const sampleRoutes = [
    {
        name: "Horton Plains Nature Trail",
        description: "A scenic hiking trail through Horton Plains National Park, featuring World's End viewpoint and Baker's Falls",
        activityType: "hiking",
        difficulty: "moderate",
        distance: 9.5, // km
        elevation: 280, // meters
        averageTime: 240, // 4 hours in minutes
        location: "Horton Plains National Park, Nuwara Eliya",
        mapUrl: "https://res.cloudinary.com/dq1hjlghb/raw/upload/v1740252958/gpx/psiwcv4czwhhmssbsmcs.gpx",
        images: [
            "https://res.cloudinary.com/dq1hjlghb/image/upload/v1740252957/route_images/bj9mqhfude6az9ue9k01.jpg"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Galle Fort Coastal Ride",
        description: "A picturesque coastal cycling route around the historic Galle Fort and along the southern coastline",
        activityType: "cycling",
        difficulty: "easy",
        distance: 12.8, // km
        elevation: 45, // meters
        averageTime: 60, // 1 hour in minutes
        location: "Galle Fort, Southern Province",
        mapUrl: "https://res.cloudinary.com/dq1hjlghb/raw/upload/v1740253332/gpx/ospy5b3bd2ed9ed1ptx2.gpx",
        images: [
            "https://res.cloudinary.com/dq1hjlghb/image/upload/v1740253331/route_images/frdledvpk8sdlk4ulkvo.jpg"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Knuckles Mountain Trail",
        description: "Challenging trail through the Knuckles Mountain Range with diverse terrain and spectacular views",
        activityType: "hiking",
        difficulty: "hard",
        distance: 14.5, // km
        elevation: 850, // meters
        averageTime: 360, // 6 hours in minutes
        location: "Knuckles Mountain Range, Central Province",
        mapUrl: "https://res.cloudinary.com/dq1hjlghb/raw/upload/v1740293350/gpx/ydr9satncc6ln1blific.gpx",
        images: [
            "https://res.cloudinary.com/dq1hjlghb/image/upload/v1740293346/route_images/mkxttljoj3mnf6pz5v5q.jpg"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Colombo Heritage Walk",
        description: "An urban walking tour exploring Colombo's colonial architecture and modern landmarks",
        activityType: "walking",
        difficulty: "easy",
        distance: 4.2, // km
        elevation: 10, // meters
        averageTime: 120, // 2 hours in minutes
        location: "Colombo Fort, Western Province",
        mapUrl: "https://res.cloudinary.com/dq1hjlghb/raw/upload/v1740293752/gpx/iqrwh5ws3zrr2klngy1s.gpx",
        images: [
            "https://res.cloudinary.com/dq1hjlghb/image/upload/v1740293750/route_images/v0id029rva3loxajoqik.jpg"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Hanthana Mountain Bike Trail",
        description: "Technical mountain biking route through Hanthana mountain range with challenging descents and climbs",
        activityType: "cycling",
        difficulty: "expert",
        distance: 16.3, // km
        elevation: 720, // meters
        averageTime: 180, // 3 hours in minutes
        location: "Hanthana Mountain Range, Kandy",
        mapUrl: "https://res.cloudinary.com/dq1hjlghb/raw/upload/v1740294019/gpx/jxse9tv74zdaue9kt3op.gpx",
        images: [
            "https://res.cloudinary.com/dq1hjlghb/image/upload/v1740294018/route_images/ogmmuvogtxadsdatg5rz.jpg"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

const seedDatabase = async () => {
    try {
        // Connect to database
        const db = await connectDB();
        console.log('Connected to database');

        // Get the routes collection
        const routesCollection = db.collection('routes');

        // Clear existing routes
        await routesCollection.deleteMany({});
        console.log('Cleared existing routes');

        // Insert new routes
        const result = await routesCollection.insertMany(sampleRoutes);
        console.log(`Successfully inserted ${result.insertedCount} routes`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
