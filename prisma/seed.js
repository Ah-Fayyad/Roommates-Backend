const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

const locations = [
  { name: "Maadi, Cairo", lat: 29.9602, lng: 31.2569 },
  { name: "Nasr City, Cairo", lat: 30.0444, lng: 31.2357 },
  { name: "Sheikh Zayed, Giza", lat: 30.0444, lng: 30.9667 },
  { name: "New Cairo, Cairo", lat: 30.0074, lng: 31.4913 },
  { name: "Dokki, Giza", lat: 30.0385, lng: 31.2118 },
  { name: "Zamalek, Cairo", lat: 30.0609, lng: 31.2197 },
  { name: "Heliopolis, Cairo", lat: 30.089, lng: 31.3284 },
  { name: "6th of October, Giza", lat: 29.9759, lng: 30.9448 },
];

async function main() {
  console.log("🧹 Cleaning database...");
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.visitRequest.deleteMany();
  await prisma.listingView.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.image.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.adminAction.deleteMany();
  await prisma.preference.deleteMany();
  await prisma.user.deleteMany();

  console.log("🌱 Seeding database...");

  const password = "password123";
  const hashedPass = await bcrypt.hash(password, 10);

  // 1. Create Key Users
  const landlord = await prisma.user.create({
    data: {
      fullName: "Ahmed Khaled (Landlord)",
      email: "ahmed@example.com",
      password: hashedPass,
      phoneNumber: "+201112345678",
      role: "LANDLORD",
      isVerified: true,
      university: "Cairo University",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400",
      bio: "Professional landlord with premium listings in Maadi and Zayed.",
      preferences: {
        create: { cleanliness: 5, studyHabits: 3, pets: false, gender: "ANY" },
      },
    },
  });

  const admin = await prisma.user.create({
    data: {
      fullName: "System Admin",
      email: "admin@example.com",
      password: hashedPass,
      phoneNumber: "+201012345678",
      role: "ADMIN",
      isVerified: true,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      bio: "Platform Administrator",
      preferences: {
        create: { cleanliness: 5, studyHabits: 5, pets: false, gender: "ANY" },
      },
    },
  });

  const sara = await prisma.user.create({
    data: {
      fullName: "Sara Mousa",
      email: "sara@example.com",
      password: hashedPass,
      phoneNumber: "+201212345678",
      role: "USER",
      isVerified: true,
      university: "AUC",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      bio: "Graphic Design student at AUC. Looking for a quiet place in New Cairo.",
      preferences: {
        create: {
          cleanliness: 5,
          studyHabits: 4,
          pets: true,
          gender: "FEMALE",
        },
      },
    },
  });

  const omar = await prisma.user.create({
    data: {
      fullName: "Omar Hassan",
      email: "omar@example.com",
      password: hashedPass,
      phoneNumber: "+201512345678",
      role: "USER",
      isVerified: true,
      university: "GUC",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      bio: "Engineering student. Love football and gaming.",
      preferences: {
        create: { cleanliness: 3, studyHabits: 3, pets: false, gender: "MALE" },
      },
    },
  });

  console.log("✅ Key users created");

  // 2. Create Dummy Landlords (since only they can post)
  const dummyLandlords = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        fullName: `Landlord ${i}`,
        email: `landlord${i}@example.com`,
        password: hashedPass,
        phoneNumber: `+2010000000${i.toString().padStart(2, "0")}`,
        role: "LANDLORD",
        isVerified: true,
        university: i % 2 === 0 ? "Ain Shams" : "Helwan",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=landlord${i}`,
        bio: "Property owner looking for reliable tenants.",
        preferences: {
          create: {
            cleanliness: Math.floor(Math.random() * 5) + 1,
            studyHabits: Math.floor(Math.random() * 5) + 1,
            pets: i % 3 === 0,
            gender: "ANY",
          },
        },
      },
    });
    dummyLandlords.push(user);
  }
  console.log("✅ Dummy Landlords created");

  // 3. Create Listings
  const amenitiesPool = [
    "WiFi",
    "AC",
    "Balcony",
    "Private Bath",
    "Kitchen",
    "Security",
    "Pool",
    "Gym",
    "Washer",
  ];

  // Landlord Ahmed's Listings
  await prisma.listing.create({
    data: {
      ownerId: landlord.id,
      title: "Luxury Studio in Maadi Degla",
      description:
        "Modern studio with american kitchen and reliable internet. Perfect for expats or students.",
      price: 8500,
      address: "Road 233, Maadi Digla, Cairo",
      latitude: 29.959,
      longitude: 31.27,
      roomType: "studio",
      size: 45,
      amenities: JSON.stringify(["WiFi", "AC", "Kitchen", "Security"]),
      status: "ACTIVE",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
          },
          {
            url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
          },
        ],
      },
    },
  });

  await prisma.listing.create({
    data: {
      ownerId: landlord.id,
      title: "Cozy Room near AUC",
      description:
        "Walking distance to AUC gate 4. Shared apartment with 2 other students.",
      price: 4500,
      address: "Spot Mall area, New Cairo",
      latitude: 30.025,
      longitude: 31.49,
      roomType: "private",
      size: 20,
      amenities: JSON.stringify(["WiFi", "AC", "Washer"]),
      status: "ACTIVE",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800",
          },
        ],
      },
    },
  });

  // Generate 50 Random Listings
  for (let i = 0; i < 50; i++) {
    const location = locations[Math.floor(Math.random() * locations.length)];
    const price = Math.floor(Math.random() * (12000 - 2000) + 2000);
    const owner = dummyLandlords[i % dummyLandlords.length] || landlord; // All owned by landlords
    const amenities = amenitiesPool.sort(() => 0.5 - Math.random()).slice(0, 4);

    await prisma.listing.create({
      data: {
        ownerId: owner.id, // User acting as owner (roommate search) or actual landlord
        title: `${owner.role === "LANDLORD" ? "Premium" : "Shared"} Room in ${location.name.split(",")[0]}`,
        description: `Great opportunity in ${location.name}. Close to transportation and markets. ${owner.role === "USER" ? "Looking for a roommate to share this apartment." : "Available for immediate rent."}`,
        price: price,
        address: location.name,
        latitude: location.lat + (Math.random() * 0.02 - 0.01),
        longitude: location.lng + (Math.random() * 0.02 - 0.01),
        roomType: i % 3 === 0 ? "studio" : i % 2 === 0 ? "private" : "shared",
        size: 15 + Math.floor(Math.random() * 50),
        amenities: JSON.stringify(amenities),
        status: "ACTIVE",
        images: {
          create: [
            { url: `https://picsum.photos/seed/${i + 100}/800/600` },
            { url: `https://picsum.photos/seed/${i + 200}/800/600` },
          ],
        },
      },
    });
  }
  console.log("✅ 50+ Listings created");

  // 4. Create Chat Conversation (Sara <-> Ahmed)
  const chat = await prisma.chat.create({
    data: {
      participants: {
        connect: [{ id: sara.id }, { id: landlord.id }],
      },
      messages: {
        create: [
          {
            senderId: sara.id,
            content: "Hi Ahmed, is the studio in Maadi still available?",
          },
          {
            senderId: landlord.id,
            content:
              "Hello Sara! Yes it is. Would you like to schedule a visit?",
          },
          {
            senderId: sara.id,
            content: "That would be great. How about tomorrow at 5 PM?",
          },
        ],
      },
    },
  });
  console.log("✅ Sample Chat created");

  console.log("\n=============================================");
  console.log("🎉 Seed Completed Successfully!");
  console.log("---------------------------------------------");
  console.log("🔑 Credentials (Password: password123)");
  console.log("---------------------------------------------");
  console.log("👨‍💼 Landlord: ahmed@example.com");
  console.log("👮‍♂️ Admin:    admin@example.com");
  console.log("👩‍🎓 User 1:   sara@example.com");
  console.log("👨‍🎓 User 2:   omar@example.com");
  console.log("=============================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
