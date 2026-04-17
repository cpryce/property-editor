#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting MongoDB..."
if [ "$(docker inspect -f '{{.State.Running}}' mongodb 2>/dev/null)" = "true" ]; then
  echo "MongoDB container already running."
else
  docker run -d \
    --name mongodb \
    -p 27017:27017 \
    -v mongodb_data:/data/db \
    mongodb/mongodb-community-server:latest 2>/dev/null || docker start mongodb
fi

echo "Waiting for MongoDB on port 27017..."
until docker exec mongodb mongosh --quiet --eval "db.runCommand({ ping: 1 })" > /dev/null 2>&1; do
  sleep 1
done
echo "MongoDB is up."

echo "Starting server..."
cd "$ROOT/server" && npm start &
SERVER_PID=$!

echo "Waiting for server on port 3001..."
until curl -s http://localhost:3001/api/properties > /dev/null 2>&1; do
  sleep 1
done

echo "Server is up. Starting client..."
cd "$ROOT/client" && npm start &
CLIENT_PID=$!

# On Ctrl+C, kill both processes
trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT TERM

wait $SERVER_PID $CLIENT_PID
