/**
 * Seed script — inserts 15 mock property records into MongoDB.
 * Run with: node server/seed.js
 * Data is stored in the same flattened shape that flattenForApi produces.
 */

const mongoose = require('mongoose');
const Property = require('../server/src/models/Property');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/property-editor';

const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Hank', 'Iris', 'James', 'Karen', 'Leo', 'Mia', 'Nathan', 'Olivia'];
const lastNames  = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White'];
const genders    = ['M', 'F', 'M', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F'];
const characters = ['The Hero', 'The Mentor', 'The Trickster', 'The Guardian', 'The Sage', 'The Rebel', 'The Caretaker', 'The Explorer', 'The Creator', 'The Jester', 'The Ruler', 'The Lover', 'The Innocent', 'The Magician', 'The Everyman'];

const streets  = ['123 Maple St', '456 Oak Ave', '789 Pine Rd', '321 Elm Dr', '654 Cedar Ln', '987 Birch Blvd', '111 Walnut Way', '222 Spruce Ct', '333 Willow Pl', '444 Chestnut St', '555 Poplar Ave', '666 Hickory Rd', '777 Sycamore Dr', '888 Magnolia Ln', '999 Redwood Blvd'];
const cities   = ['Austin', 'Denver', 'Portland', 'Nashville', 'Seattle', 'Atlanta', 'Boston', 'Chicago', 'Phoenix', 'Miami', 'Dallas', 'Minneapolis', 'San Diego', 'Charlotte', 'Detroit'];
const states   = ['Texas', 'Colorado', 'Oregon', 'Tennessee', 'Washington', 'Georgia', 'Massachusetts', 'Illinois', 'Arizona', 'Florida', 'Texas', 'Minnesota', 'California', 'North Carolina', 'Michigan'];
const zips     = ['78701', '80201', '97201', '37201', '98101', '30301', '02101', '60601', '85001', '33101', '75201', '55401', '92101', '28201', '48201'];
const phones   = ['512-555-0101', '720-555-0102', '503-555-0103', '615-555-0104', '206-555-0105', '404-555-0106', '617-555-0107', '312-555-0108', '602-555-0109', '305-555-0110', '214-555-0111', '612-555-0112', '619-555-0113', '704-555-0114', '313-555-0115'];

const cardTypes   = ['Visa', 'Mastercard', 'American Express', 'Discover', 'Visa', 'Mastercard', 'American Express', 'Discover', 'Visa', 'Mastercard', 'American Express', 'Discover', 'Visa', 'Mastercard', 'Visa'];
const last4s      = ['1234', '5678', '9012', '3456', '7890', '2345', '6789', '0123', '4567', '8901', '1357', '2468', '1111', '2222', '3333'];
const expMonths   = [1, 3, 5, 7, 9, 11, 2, 4, 6, 8, 10, 12, 1, 6, 11];
const expYears    = ['2027', '2028', '2029', '2030', '2026', '2031', '2032', '2027', '2028', '2029', '2030', '2026', '2031', '2028', '2027'];
const addrTypes   = ['billing', 'mailing', 'shipping', 'billing', 'mailing', 'shipping', 'billing', 'mailing', 'shipping', 'billing', 'mailing', 'shipping', 'billing', 'mailing', 'shipping'];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to', MONGO_URI);

  const docs = firstNames.map((firstName, i) => ({
    firstName,
    lastName:      lastNames[i],
    gender:        genders[i],
    characterName: characters[i],
    addresses: [{
      nickname:  `${firstName}'s ${addrTypes[i]} address`,
      type:      addrTypes[i],
      street:    streets[i],
      city:      cities[i],
      state:     states[i],
      zip:       zips[i],
      isDefault: true,
      ...(addrTypes[i] === 'shipping' ? {
        phones: [{
          number:    phones[i],
          label:     'mobile',
          isDefault: true,
        }],
      } : {}),
    }],
    creditCards: [{
      nickname:        `${firstName}'s ${cardTypes[i]}`,
      cardholderName:  `${firstName} ${lastNames[i]}`,
      cardType:        cardTypes[i],
      last4:           last4s[i],
      expirationMonth: expMonths[i],
      expirationYear:  expYears[i],
      isDefault:       true,
    }],
  }));

  const result = await Property.insertMany(docs);
  console.log(`Inserted ${result.length} records.`);
  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
