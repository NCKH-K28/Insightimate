#!/bin/bash
set -e

echo "🚀 Setting up Insightimate..."

echo "📦 Pushing Prisma Schema to Database..."
pnpm prisma db push

echo "🛡️ Setting up OpenFGA..."
FGA_API_URL="http://localhost:8080"
STORE_NAME="Insightimate"
FGA_SCHEMA_PATH="./policies/openfga/schema-v1.fga"

# Check if FGA is reachable
if ! curl -s "$FGA_API_URL/healthz" > /dev/null; then
  echo "❌ Error: OpenFGA is not running at $FGA_API_URL. Please make sure Docker containers are running."
  exit 1
fi

# Look for an existing FGA_STORE_ID in .env.local
STORE_ID=$(grep "^FGA_STORE_ID=" .env.local 2>/dev/null | cut -d '=' -f 2)

if [ -z "$STORE_ID" ] || [ "$STORE_ID" == "''" ] || [ "$STORE_ID" == '""' ]; then
  echo "🆕 Creating new OpenFGA Store..."
  RESPONSE=$(curl -s -X POST "$FGA_API_URL/stores" -H "Content-Type: application/json" -d "{\"name\": \"$STORE_NAME\"}")
  STORE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
  
  if [ -n "$STORE_ID" ]; then
    echo "✅ Created OpenFGA Store with ID: $STORE_ID"
    # Update or add FGA_STORE_ID in .env.local
    if grep -q "^FGA_STORE_ID" .env.local 2>/dev/null; then
      sed -i "s/^FGA_STORE_ID=.*/FGA_STORE_ID=$STORE_ID/" .env.local
    else
      echo "FGA_STORE_ID=$STORE_ID" >> .env.local
    fi
    echo "📝 Updated .env.local with new FGA_STORE_ID."
  else
    echo "❌ Failed to create OpenFGA Store."
    exit 1
  fi
else
  echo "✅ OpenFGA Store ID found in .env.local: $STORE_ID"
fi

echo "📤 Pushing Authorization Model to OpenFGA Store..."
docker run --rm -v $(pwd)/policies/openfga:/policies --network host openfga/cli model write --store-id "$STORE_ID" --file "/policies/schema-v1.fga" --api-url "$FGA_API_URL"

echo "🎉 Setup complete! You can now run 'pnpm run dev'."
