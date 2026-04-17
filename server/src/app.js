const express = require('express');
const cors = require('cors');
const propertiesRouter = require('./routes/properties');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/properties', propertiesRouter);

module.exports = app;
