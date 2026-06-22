# Vercel Deployment Configuration

## Environment Variables Required

Add these to your Vercel project settings:

### Database
```
DATABASE_URL=postgresql://user:password@db.host:5432/roommates
```
> ⚠️ **IMPORTANT**: Change from SQLite to PostgreSQL for Vercel deployment
> Use providers like: Railway, Vercel Postgres, AWS RDS, or Supabase

### Authentication & Security
```
JWT_SECRET=your-production-jwt-secret-key-change-this
NODE_ENV=production
PORT=3000
```

### Frontend Configuration
```
FRONTEND_URL=https://roommates-frontend.vercel.app
```

### Services (Optional but Recommended)
```
# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Setup Steps

### 1. Create PostgreSQL Database
- Option A: Railway (Recommended for Vercel)
  - Go to railway.app
  - Create new PostgreSQL database
  - Copy connection string to DATABASE_URL

- Option B: Vercel Postgres
  - In Vercel dashboard → Storage → Create Postgres
  - Copy connection string

### 2. Update Prisma for Production
If needed, change `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Run Migrations
```bash
npx prisma migrate deploy
```

### 4. Deploy to Vercel
```bash
git push origin main
# Vercel will auto-deploy
```

## Local Development
- Database: SQLite (`file:./prisma/dev.db`)
- Env: See `.env` file
- Run: `npm run dev`

## Testing
```bash
# Health check
curl https://roommates-backend.vercel.app/health

# Should return:
# {"status":"ok"}
```

## Troubleshooting

### 500 Error on Vercel
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run migrations: `npx prisma migrate deploy`

### CORS Issues
- Update FRONTEND_URL in Vercel env
- Check CORS origins in `src/app.ts`

### Socket.io Issues
- Vercel serverless doesn't support persistent connections
- Consider: Socket.io adapter with Redis, or use HTTP polling
