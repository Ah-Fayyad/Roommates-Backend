# Backend API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

### POST /auth/signup
Register a new user.
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

### POST /auth/login
Login existing user.
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Users

### GET /users/me
Get current user profile.
**Headers:** `Authorization: Bearer <token>`

### PUT /users/me
Update profile.
**Body:**
```json
{
  "fullName": "Jane Doe",
  "bio": "Student at XYZ University"
}
```

## Listings

### GET /listings
Get all listings with filters.
**Query Params:** `minPrice`, `maxPrice`, `university`

### POST /listings
Create a new listing.
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "title": "Room near campus",
  "price": 500,
  "address": "123 Main St",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "images": ["url1", "url2"]
}
```

## Matches

### GET /matches
Get compatible roommates based on preferences.
**Headers:** `Authorization: Bearer <token>`

## Chat

### GET /chats
Get all active chats.

### GET /chats/:chatId/messages
Get message history for a chat.
