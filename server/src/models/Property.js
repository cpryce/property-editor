const mongoose = require('mongoose');

const attributeSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true },
    title: { type: String, required: true },
    score: { type: Number, min: 0, default: 10 },
  },
  { _id: false }
);

const DEFAULT_ATTRIBUTES = [
  { name: 'Strength',     title: 'Str', score: 10 },
  { name: 'Dexterity',    title: 'Dex', score: 10 },
  { name: 'Constitution', title: 'Con', score: 10 },
  { name: 'Intelligence', title: 'Int', score: 10 },
  { name: 'Wisdom',       title: 'Wis', score: 10 },
  { name: 'Charisma',     title: 'Cha', score: 10 },
];

const propertySchema = new mongoose.Schema(
  {
    firstName:     { type: String, required: true },
    lastName:      { type: String, required: true },
    gender:        { type: String, enum: ['M', 'F'], required: true },
    characterName: { type: String, required: true },
    attributes:    { type: [attributeSchema], default: () => DEFAULT_ATTRIBUTES },
  },
  { timestamps: true }
);

propertySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Property', propertySchema);
