const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

jest.setTimeout(30000); // MongoMemoryServer setup can be slow on first run

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  // Set URI before requiring server modules so the server's mongoose picks it up
  process.env.MONGO_URI = mongod.getUri();
  const connectDB = require('../server/src/db');
  await connectDB();
  app = require('../server/src/app');
});

afterAll(async () => {
  const { mongoose } = require('../server/src/db');
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const { mongoose } = require('../server/src/db');
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('POST /api/properties', () => {
  it('creates a property and returns it with an id', async () => {
    const res = await request(app)
      .post('/api/properties')
      .send({ firstName: 'John', lastName: 'Doe', gender: 'M', characterName: 'Hero' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.firstName).toBe('John');
    expect(res.body.lastName).toBe('Doe');
    expect(res.body.gender).toBe('M');
    expect(res.body.characterName).toBe('Hero');
  });

  it('returns 400 for invalid gender', async () => {
    const res = await request(app)
      .post('/api/properties')
      .send({ firstName: 'X', lastName: 'Y', gender: 'X', characterName: 'Z' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/properties', () => {
  it('returns all properties', async () => {
    await request(app)
      .post('/api/properties')
      .send({ firstName: 'Jane', lastName: 'Doe', gender: 'F', characterName: 'Villain' });
    const res = await request(app).get('/api/properties');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns empty array when no properties exist', async () => {
    const res = await request(app).get('/api/properties');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('GET /api/properties/:id', () => {
  it('returns a single property by id', async () => {
    const created = await request(app)
      .post('/api/properties')
      .send({ firstName: 'Alice', lastName: 'Smith', gender: 'F', characterName: 'Sidekick' });
    const res = await request(app).get(`/api/properties/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/properties/000000000000000000000000');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/properties/:id', () => {
  it('updates a property', async () => {
    const created = await request(app)
      .post('/api/properties')
      .send({ firstName: 'Bob', lastName: 'Jones', gender: 'M', characterName: 'Mentor' });
    const res = await request(app)
      .put(`/api/properties/${created.body.id}`)
      .send({ firstName: 'Bobby', lastName: 'Jones', gender: 'M', characterName: 'Mentor' });
    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Bobby');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .put('/api/properties/000000000000000000000000')
      .send({ firstName: 'X', lastName: 'Y', gender: 'M', characterName: 'Z' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/properties/:id', () => {
  it('deletes a property', async () => {
    const created = await request(app)
      .post('/api/properties')
      .send({ firstName: 'Eve', lastName: 'Black', gender: 'F', characterName: 'Rival' });
    const res = await request(app).delete(`/api/properties/${created.body.id}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/properties/000000000000000000000000');
    expect(res.status).toBe(404);
  });
});
