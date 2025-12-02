
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting seed...");

    // 1. Clean up existing data (optional, but good for clean state)
    // await prisma.listing.deleteMany();
    // await prisma.user.deleteMany();

    const password = await bcrypt.hash("123456", 10);

    // 2. Create Landlord
    const landlord = await prisma.user.upsert({
        where: { email: "landlord@test.com" },
        update: {},
        create: {
            email: "landlord@test.com",
            password,
            fullName: "Ahmed Landlord",
            role: "LANDLORD",
            isVerified: true,
            bio: "I have several rooms available near the university.",
        },
    });
    console.log("✅ Created Landlord: landlord@test.com / 123456");

    // 3. Create Tenant (User)
    const tenant = await prisma.user.upsert({
        where: { email: "tenant@test.com" },
        update: {},
        create: {
            email: "tenant@test.com",
            password,
            fullName: "Ahmed Tenant",
            role: "USER",
            isVerified: true,
            bio: "Student looking for a quiet place to study.",
            university: "Cairo University",
        },
    });
    console.log("✅ Created Tenant: tenant@test.com / 123456");

    // 4. Create Admin
    const admin = await prisma.user.upsert({
        where: { email: "admin@test.com" },
        update: {},
        create: {
            email: "admin@test.com",
            password,
            fullName: "System Admin",
            role: "ADMIN",
            isVerified: true,
        },
    });
    console.log("✅ Created Admin: admin@test.com / 123456");

    // 5. Create Listings for Landlord
    const listing1 = await prisma.listing.create({
        data: {
            ownerId: landlord.id,
            title: "Modern Room near Cairo Univ",
            description: "Spacious room with balcony, fully furnished. 10 mins walk to campus.",
            price: 3500,
            address: "Dokki, Giza",
            latitude: 30.0396,
            longitude: 31.2156,
            amenities: ["WiFi", "AC", "Balcony", "Furnished"],
            status: "ACTIVE",
            images: {
                create: [
                    { url: "https://images.unsplash.com/photo-1522771753035-4848235d3f3d?ixlib=rb-4.0.3" },
                    { url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3" }
                ]
            }
        },
    });

    const listing2 = await prisma.listing.create({
        data: {
            ownerId: landlord.id,
            title: "Cozy Studio in Maadi",
            description: "Quiet studio apartment, perfect for students. Close to metro.",
            price: 5000,
            address: "Maadi, Cairo",
            latitude: 29.9602,
            longitude: 31.2569,
            amenities: ["WiFi", "Kitchen", "Private Bath"],
            status: "ACTIVE",
            images: {
                create: [
                    { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3" }
                ]
            }
        },
    });

    console.log("✅ Created 2 Listings for Landlord");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
