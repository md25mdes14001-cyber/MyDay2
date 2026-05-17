#!/bin/bash
set -e

echo "🚀 Setting up MyDay2..."

# Install PostgreSQL
sudo apt-get update -qq
sudo apt-get install -y -qq postgresql postgresql-client > /dev/null 2>&1

# Start PostgreSQL
sudo service postgresql start

# Create database and user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" > /dev/null 2>&1
sudo -u postgres createdb myday2 2>/dev/null || true

# Create .env file
cat > .env << 'ENVFILE'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myday2?schema=public"
NEXTAUTH_SECRET="myday2_secret_key_that_is_long_enough_12345"
AUTH_SECRET="myday2_secret_key_that_is_long_enough_12345"
OPENAI_API_KEY=""
ENVFILE

# Install dependencies
npm install

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

echo ""
echo "✅ MyDay2 is ready!"
echo "👉 Run: npm run dev -- -H 0.0.0.0"
echo ""
