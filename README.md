# Roommates Backend

Node.js + Express + PostgreSQL backend API for the Roommates platform.

## Features

- 🔐 **Authentication**: JWT-based auth with bcrypt
- 📝 **CRUD Operations**: Users, Listings, Chats, etc.
- 💬 **Real-time Chat**: Socket.io integration
- 🤖 **AI Integration**: Claude API for smart matching
- 📊 **Analytics**: Track views, visits, and user activity
- 🔔 **Notifications**: Real-time notification system
- 📸 **Image Upload**: Cloudinary integration
- 🛡️ **Security**: Helmet, CORS, validation

## Tech Stack

- **Node.js** with TypeScript
- **Express.js** framework
- **PostgreSQL** database
- **Prisma** ORM
- **Socket.io** for real-time features
- **JWT** for authentication
- **Cloudinary** for image storage

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ah-Fayyad/Roommates-Backend.git
cd Roommates-Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
DATABASE_URL="postgresql://postgres@localhost:5433/roommates_db?schema=public"
JWT_SECRET="your_jwt_secret_key_here"
CLAUDE_API_KEY="your_anthropic_api_key"
NODE_ENV="development"
```

4. Set up the database:
```bash
npx prisma db push
```

5. Seed demo data (optional):
```bash
npx ts-node scripts/seed_demo.ts
```

6. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:id` - Get user by ID

### Listings
- `GET /api/listings` - Get all listings
- `POST /api/listings` - Create listing
- `GET /api/listings/:id` - Get listing details
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing

### Chats
- `GET /api/chats` - Get user chats
- `POST /api/chats` - Create chat
- `POST /api/chats/:id/messages` - Send message

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/reports` - Get reports
- `PUT /api/admin/reports/:id` - Update report status

See `README_API.md` for complete API documentation.

## Database Schema

The application uses Prisma ORM with PostgreSQL. Main models:

- **User**: User accounts (USER, LANDLORD, ADMIN roles)
- **Listing**: Room/apartment listings
- **Chat**: Chat conversations
- **Message**: Chat messages
- **Favorite**: Saved listings
- **VisitRequest**: Schedule property visits
- **Report**: User/listing reports
- **Notification**: User notifications

Run `npx prisma studio` to explore the database visually.

## Environment Variables

Required environment variables:

- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `CLAUDE_API_KEY` - Anthropic API key (optional)
- `NODE_ENV` - Environment (development/production)

## Demo Accounts

After running the seed script:

- **Landlord**: `landlord@test.com` / `123456`
- **Tenant**: `tenant@test.com` / `123456`
- **Admin**: `admin@test.com` / `123456`

## Deployment

### Railway / Render / Heroku

1. Connect your GitHub repository
2. Set environment variables
3. Add PostgreSQL database addon
4. Deploy!

Build command: `npm run build`
Start command: `npm start`

## Project Structure

```
src/
├── controllers/     # Route controllers
├── routes/         # API routes
├── middleware/     # Custom middleware
├── utils/          # Utility functions
├── socket/         # Socket.io handlers
├── chatbot/        # AI chatbot logic
├── app.ts          # Express app setup
└── server.ts       # Server entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
