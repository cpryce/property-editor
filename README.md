# Property Editor

A full-stack CRUD web application for managing properties, built with Node.js/Express, React, and MongoDB.

---

## Prerequisites

- [Node.js](https://nodejs.org) (v18+)
- [Docker](https://www.docker.com) (for running MongoDB)

---

## 1. Start MongoDB (Docker)

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongodb/mongodb-community-server:latest
```

MongoDB connection string: `mongodb://localhost:27017`

---

## 2. Install Dependencies

```bash
# Server
cd server && npm install

# Client
cd client && npm install

# Tests
cd tests && npm install
```

---

## 3. Run the Server

```bash
cd server && npm start
```

Server runs on **http://localhost:3001**

---

## 4. Run the React Client

```bash
cd client && npm start
```

Client runs on **http://localhost:3000** and proxies API calls to the server.

---

## 5. Run Tests

```bash
cd tests && npm test
```

Tests use an in-memory MongoDB — no running database required.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | List all properties |
| GET | `/api/properties/:id` | Get a single property |
| POST | `/api/properties` | Create a new property |
| PUT | `/api/properties/:id` | Update a property |
| DELETE | `/api/properties/:id` | Delete a property |

