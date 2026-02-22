import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const universities = ['جامعة القاهرة', 'جامعة عين شمس', 'الجامعة الأمريكية', 'الجامعة الألمانية', 'جامعة حلوان', 'جامعة الإسكندرية'];
const locations = [
    { address: 'مدينة نصر، القاهرة', lat: 30.0444, lng: 31.2357 },
    { address: 'المعادي، القاهرة', lat: 29.9602, lng: 31.2569 },
    { address: 'الزمالك، القاهرة', lat: 30.0609, lng: 31.2197 },
    { address: 'الدقي، الجيزة', lat: 30.0385, lng: 31.2118 },
    { address: '6 أكتوبر، الجيزة', lat: 29.9759, lng: 30.9448 },
    { address: 'القاهرة الجديدة، القاهرة', lat: 30.0074, lng: 31.4913 },
    { address: 'الشيخ زايد، الجيزة', lat: 30.0444, lng: 30.9667 },
    { address: 'مصر الجديدة، القاهرة', lat: 30.0890, lng: 31.3284 },
    { address: 'المهندسين، الجيزة', lat: 30.0511, lng: 31.2045 },
    { address: 'مدينة الرحاب، القاهرة', lat: 30.0617, lng: 31.4916 }
];

const amenitiesList = ['wifi', 'ac', 'balcony_label', 'kitchen', 'laundry', 'parking', 'elevator', 'security', 'gym', 'pool'];

async function main() {
    console.log('Start seeding ...');

    // Clean up existing data
    await prisma.notification.deleteMany();
    await prisma.report.deleteMany();
    await prisma.adminAction.deleteMany();
    await prisma.verificationRequest.deleteMany();
    await prisma.listingView.deleteMany();
    await prisma.message.deleteMany();
    await prisma.chat.deleteMany();
    await prisma.visitRequest.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.image.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.preference.deleteMany();
    await prisma.user.deleteMany();

    console.log('Deleted existing data.');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const roomImages = [
        "https://images.unsplash.com/photo-1522771753035-484bc95f9d43?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1560185009-dddeb820c7b7?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1564078516393-cf04bd966897?auto=format&fit=crop&w=1000&q=80"
    ];

    // Create Users (Tenants)
    const users = [];
    console.log('Creating 60 Users...');
    for (let i = 0; i < 60; i++) {
        const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
        const firstName = gender === 'MALE'
            ? ['أحمد', 'محمد', 'عمر', 'يوسف', 'علي', 'زياد', 'خالد', 'مصطفى'][i % 8]
            : ['سارة', 'نور', 'ليلى', 'مريم', 'ياسمين', 'هنا', 'مايا', 'سلمى'][i % 8];

        const user = await prisma.user.create({
            data: {
                email: `user${i}@example.com`,
                password: hashedPassword,
                fullName: `${firstName} ${i % 2 === 0 ? 'فايد' : 'حسان'}`,
                phoneNumber: `+2010${(10000000 + i).toString()}`,
                avatar: `https://i.pravatar.cc/300?u=user${i}`,
                bio: i % 2 === 0 ? "طالب في جامعة القاهرة. أبحث عن مكان هادئ للدراسة." : "طالبة أعمل بجانب الدراسة، أحب الطبخ والحيوانات الأليفة!",
                university: universities[i % universities.length],
                isVerified: i % 3 === 0,
                role: 'USER',
                preferences: {
                    create: {
                        cleanliness: Math.floor(Math.random() * 5) + 1,
                        studyHabits: Math.floor(Math.random() * 5) + 1,
                        pets: i % 2 === 0,
                        budget: 2000 + (Math.floor(Math.random() * 20) * 200),
                        gender: i % 3 === 0 ? 'ANY' : gender
                    }
                }
            }
        });
        users.push(user);
    }

    // Create Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
        data: {
            email: 'admin@roommates.com',
            password: adminPassword,
            fullName: 'مدير النظام',
            phoneNumber: '+201111111111',
            role: 'ADMIN',
            avatar: 'https://i.pravatar.cc/300?u=admin',
            bio: 'مسؤول المنصة الرسمي',
            isVerified: true
        }
    });

    // Create Landlords
    const landlords = [];
    console.log('Creating 20 Landlords...');
    for (let i = 0; i < 20; i++) {
        const landlordName = ['محمود', 'إبراهيم', 'سيد', 'طارق', 'إيهاب'][i % 5];
        const landlord = await prisma.user.create({
            data: {
                email: `landlord${i}@example.com`,
                password: hashedPassword,
                fullName: `${landlordName} صاحب عقار`,
                phoneNumber: `+2012${(20000000 + i).toString()}`,
                avatar: `https://i.pravatar.cc/300?u=landlord${i}`,
                bio: `مدير عقارات محترف. لدي عدة وحدات سكنية في مناطق طلابية متميزة.`,
                university: universities[i % universities.length],
                isVerified: true,
                role: 'LANDLORD'
            }
        });
        landlords.push(landlord);
    }

    // Create Listings
    console.log('Creating 200 Listings...');
    const listings = [];
    for (let i = 0; i < 200; i++) {
        const owner = landlords[i % landlords.length];
        const location = locations[i % locations.length];
        const randomAmenities = amenitiesList.sort(() => 0.5 - Math.random()).slice(0, 5);

        const imageIndex = i % roomImages.length;
        const image1 = roomImages[imageIndex];
        const image2 = roomImages[(imageIndex + 1) % roomImages.length];
        const image3 = roomImages[(imageIndex + 2) % roomImages.length];

        const title = `غرفة مميزة في ${location.address.split('،')[0]}`;
        const description = `شقة رائعة للطلاب العفش جديد ومكيف بالكامل. قريبة من المواصلات والجامعة. السعر شامل الخدمات والإنترنت عالي السرعة.`;

        const listing = await prisma.listing.create({
            data: {
                ownerId: owner.id,
                title: title,
                description: description,
                price: 2500 + (Math.floor(Math.random() * 60) * 100),
                address: location.address,
                latitude: location.lat + (Math.random() * 0.02 - 0.01),
                longitude: location.lng + (Math.random() * 0.02 - 0.01),
                amenities: JSON.stringify(randomAmenities),
                status: 'ACTIVE',
                images: {
                    create: [
                        { url: image1 },
                        { url: image2 },
                        { url: image3 }
                    ]
                }
            }
        });
        listings.push(listing);
    }

    // Create Chats & Messages
    console.log('Creating Conversations...');
    for (let i = 0; i < 15; i++) {
        const user = users[i];
        const landlord = landlords[i % landlords.length];

        const chat = await prisma.chat.create({
            data: {
                participants: {
                    connect: [{ id: user.id }, { id: landlord.id }]
                }
            }
        });

        await prisma.message.createMany({
            data: [
                { chatId: chat.id, senderId: user.id, content: "مرحباً! هل هذه الغرفة لا تزال متاحة؟", read: true },
                { chatId: chat.id, senderId: landlord.id, content: "نعم بالتأكيد! متى تود معاينتها؟", read: true },
                { chatId: chat.id, senderId: user.id, content: "هل يمكنني المجيء غداً الساعة 5 مساءً؟", read: i % 3 === 0 }
            ]
        });
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
