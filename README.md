#  Roommates Backend API

<div dir="rtl">

**خادم Express.js متقدم للبحث عن شركاء السكن مع قاعدة بيانات Prisma وخدمات AI**

**Advanced Express.js backend server with Prisma database and AI services for finding compatible roommates.**

###  الحالة | Status

 **قيد التشغيل والاختبار** | Functional & Testing

---

##  المحتويات | Table of Contents

- [البدء السريع](#البدء-السريع)
- [التثبيت](#التثبيت)
- [API Endpoints](#api-endpoints)
- [قاعدة البيانات](#قاعدة-البيانات)
- [الخدمات](#الخدمات)
- [الأمان](#الأمان)

---

## البدء السريع | Quick Start

```bash
# استنساخ
git clone https://github.com/Ah-Fayyad/Roommates-Backend
cd Roommates-Backend

# تثبيت
npm install

# إعداد البيئة
echo "PORT=5000" > .env
echo "DATABASE_URL=file:./prisma/dev.db" >> .env
echo "JWT_SECRET=your-secret-key" >> .env
echo "NODE_ENV=development" >> .env

# إعداد قاعدة البيانات
npx prisma generate
npx prisma db push
npx prisma db seed

# التشغيل
npm run dev
```

**يعمل على:** http://localhost:5000

---

## التثبيت الكامل | Full Installation

### المتطلبات | Prerequisites

- Node.js v18+
- npm v9+
- SQLite أو PostgreSQL

### خطوات التثبيت

1. **استنساخ المستودع**
```bash
git clone https://github.com/Ah-Fayyad/Roommates-Backend
cd Roommates-Backend
```

2. **تثبيت المكتبات**
```bash
npm install
```

3. **إعداد متغيرات البيئة** (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="file:./prisma/dev.db"

# Authentication
JWT_SECRET="your-super-secret-key-change-in-production"

# Frontend
FRONTEND_URL=http://localhost:5173

# Optional Services
GEMINI_API_KEY=your-key
CLOUDINARY_NAME=your-name
CLOUDINARY_KEY=your-key
CLOUDINARY_SECRET=your-secret
```

4. **إعداد قاعدة البيانات**
```bash
# توليد Prisma Client
npx prisma generate

# دفع Schema
npx prisma db push

# إدراج البيانات الاختبارية
npx prisma db seed
```

5. **التشغيل**
```bash
npm run dev
```

---

## API Endpoints | نقاط النهاية

### مصادقة | Authentication

```
POST /api/auth/signup
 Body: { email, password, fullName, role, phoneNumber, university, bio, preferences }
 Returns: { token, user }

POST /api/auth/login
 Body: { email, password }
 Returns: { token, user }

POST /api/auth/forgot-password
 Body: { email }
 Returns: { message, token }

POST /api/auth/reset-password
 Body: { token, newPassword }
 Returns: { message }
```

### المستخدمون | Users

```
GET /api/users/me
 Headers: Authorization: Bearer <token>
 Returns: { user }

GET /api/users/profile
 Returns: { user with preferences }

PUT /api/users/profile
 Body: { fullName, avatar, bio, preferences }
 Returns: { updated user }

PUT /api/users/settings
 Body: { email, language, currentPassword, newPassword }
 Returns: { message }

DELETE /api/users/account
 Returns: { message }
```

### الإعلانات | Listings

```
GET /api/listings
 Query: ?page=1&limit=20&price_min=0&price_max=5000
 Returns: { listings, total, page }

POST /api/listings
 Headers: Authorization: Bearer <token>
 Body: { title, description, price, address, roomType, size, amenities }
 Returns: { listing }

GET /api/listings/:id
 Returns: { listing with details }

PUT /api/listings/:id
 Body: { title, description, price, ... }
 Returns: { updated listing }

DELETE /api/listings/:id
 Returns: { message: "Deleted" }
```

### المحادثات | Chats

```
GET /api/chats
 Headers: Authorization: Bearer <token>
 Returns: { chats: [] }

POST /api/chats/:chatId/message
 Body: { content, type }
 Returns: { message }
```

### طلبات الزيارة | Visits

```
GET /api/visits
 Query: ?type=sent|received
 Returns: { visits: [] }

POST /api/visits
 Body: { listingId, proposedTimes, message }
 Returns: { visit }

PUT /api/visits/:id
 Body: { status }
 Returns: { updated visit }
```

### الإبلاغات | Reports

```
POST /api/reports
 Body: { targetType, targetId, reason, description }
 Returns: { report }

GET /api/reports (admin only)
 Returns: { reports: [] }
```

---

## قاعدة البيانات | Database

### النموذج | Schema

10 Models رئيسية:
- **User** - المستخدمون
- **Listing** - الإعلانات
- **Preference** - التفضيلات
- **Chat** - المحادثات
- **Message** - الرسائل
- **VisitRequest** - طلبات الزيارة
- **Favorite** - المفضلات
- **Report** - الإبلاغات
- **Notification** - الإشعارات
- **Image** - الصور

### البيانات الاختبارية

بعد تشغيل `npx prisma db seed`:

```
 Users: 60 مستخدم
 Landlords: 20 مالك عقار
 Listings: 200 إعلان
 Messages: آلاف الرسائل
 Images: آلاف الصور
```

---

## الخدمات | Services

### المصادقة | Authentication
- JWT Token Generation
- Password Hashing (bcrypt)
- Email Verification

### الإبلاغ | Notifications
- Real-time updates (Socket.io)
- Email notifications
- In-app alerts

### الصور | Image Upload
- Cloudinary Integration
- Image optimization
- URL generation

### الذكاء الاصطناعي | AI Services
- Google Gemini API
- Price suggestions
- Content analysis
- Chatbot assistance

---

## الأمان | Security

 **JWT Authentication** - مصادقة آمنة
 **Password Hashing** - bcrypt encryption
 **CORS Protection** - حماية النطاق
 **Input Validation** - التحقق من المدخلات
 **SQL Injection Prevention** - Prisma ORM
 **Rate Limiting Ready** - معد للتطبيق

---

## الأوامر | Commands

```bash
npm run dev          # تطوير مع nodemon
npm run build        # بناء للإنتاج
npm start            # تشغيل الإنتاج
npm test             # اختبارات
npm run lint         # فحص الأخطاء
```

---

## الهندسة المعمارية | Architecture

```
Express.js Server
 Routes (API endpoints)
 Controllers (Business logic)
 Services (External integrations)
 Middleware (Authentication, validation)
 Database (Prisma ORM)
 Socket.io (Real-time)
 Utils (Helpers)
```

---

## النشر | Deployment

### Railway.app (موصى به)

```bash
1. ربط GitHub Repository
2. تعيين متغيرات البيئة
3. تحديد Build command: npm run build
4. Start command: npm start
```

### Render.com

```bash
1. Connect GitHub
2. Set environment variables
3. Deploy
```

---

## استكشاف الأخطاء | Troubleshooting

**خطأ:** Database error

```bash
# الحل:
npx prisma db push
npx prisma db seed
```

**خطأ:** Port already in use

```bash
# غيّر PORT في .env أو أوقف العملية الأخرى
```

---

## الدعم | Support

-  support@roommates.com
-  GitHub Issues
-  API Documentation

---

## الترخيص | License

MIT License

<div dir="ltr">

**Last Updated:** February 22, 2026
**Status:**  Production Ready
**Version:** 1.0.0

</div>

</div>
