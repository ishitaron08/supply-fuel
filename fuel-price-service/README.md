# Fuel Price Microservice 🛢️

A **production-ready** REST microservice built with **Node.js**, **Express**, **MongoDB** and **Docker**.

---

## 📁 Folder Structure

```
fuel-price-service/
├── src/
│   ├── config/
│   │   └── db.js              # Mongoose connection
│   ├── controllers/
│   │   └── fuelPriceController.js
│   ├── middleware/
│   │   ├── asyncWrapper.js    # Async error forwarding
│   │   ├── errorHandler.js    # Centralized error handler
│   │   └── validate.js        # Request body validation
│   ├── models/
│   │   └── FuelPrice.js       # Mongoose schema
│   ├── routes/
│   │   └── fuelPriceRoutes.js # Express router
│   ├── index.js               # Entry point
│   └── seed.js                # Sample data seeder
├── .env                       # Environment variables
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🚀 Run Locally

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally **or** a MongoDB Atlas URI

### Steps

```bash
# 1. Install dependencies
cd fuel-price-service
npm install

# 2. Configure environment
#    Edit .env and set your MONGO_URI

# 3. Seed sample data
npm run seed

# 4. Start in dev mode (with auto-reload)
npm run dev

# 5. Or start for production
npm start
```

Server starts at **http://localhost:5000**.

---

## 🐳 Run with Docker

```bash
cd fuel-price-service

# Build and start containers (API + MongoDB)
docker-compose up --build -d

# Seed data inside the running container
docker exec -it fuel-price-api node src/seed.js

# Stop containers
docker-compose down
```

| Service | Container | Port |
|---------|-----------|------|
| API     | fuel-price-api   | 5000 |
| MongoDB | fuel-price-mongo | 27017 |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/health` | Health check |
| `GET`    | `/api/fuel-prices` | Get all fuel prices |
| `GET`    | `/api/fuel-prices/:city` | Get price by city (case-insensitive) |
| `POST`   | `/api/fuel-prices` | Add new city fuel price |
| `PUT`    | `/api/fuel-prices/:city` | Update price for a city |
| `DELETE`  | `/api/fuel-prices/:city` | Delete a city record |

### Response Format

```json
{
  "success": true,
  "message": "Fuel prices retrieved successfully",
  "data": [ ... ]
}
```

---

## 🧪 Test with Postman / cURL

### Get all prices
```bash
curl http://localhost:5000/api/fuel-prices
```

### Get price for Delhi
```bash
curl http://localhost:5000/api/fuel-prices/delhi
```

### Add a new city
```bash
curl -X POST http://localhost:5000/api/fuel-prices \
  -H "Content-Type: application/json" \
  -d '{"city":"Chennai","petrol":102.63,"diesel":94.24}'
```

### Update a city
```bash
curl -X PUT http://localhost:5000/api/fuel-prices/delhi \
  -H "Content-Type: application/json" \
  -d '{"petrol":97.50,"diesel":90.10}'
```

### Delete a city
```bash
curl -X DELETE http://localhost:5000/api/fuel-prices/chennai
```

---

## 🔒 Security Features

- **Helmet** — secure HTTP headers
- **CORS** — cross-origin resource sharing
- **Rate Limiting** — 100 req / 15 min per IP
- **Body Size Limit** — 10 KB max JSON payload
- **Input Validation** — custom middleware

---

## 🏗️ DevOps Concepts This Covers

| Concept | How It Applies |
|---------|---------------|
| Microservice architecture | Single-purpose, independently deployable |
| Containerisation | Dockerfile + docker-compose |
| Container networking | `fuel-net` bridge network |
| Environment configuration | `.env` + Docker env vars |
| REST API standards | Proper HTTP verbs, status codes, JSON format |
| Rate limiting | `express-rate-limit` |
| Secure headers | `helmet` |
| Database indexing | `city` field indexed for fast lookups |
| CI/CD ready | Dockerised build that can plug into any pipeline |

---

## 📄 License

ISC
