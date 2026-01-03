#!/bin/sh

# Run migrations to ensure database schema is up to date
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting application..."
npm run start
