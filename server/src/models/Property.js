const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    firstName:     { type: String, required: true },
    lastName:      { type: String, required: true },
    gender:        { type: String, enum: ['M', 'F'], required: true },
    characterName: { type: String },
    addresses:     { type: [mongoose.Schema.Types.Mixed], default: [] },
    creditCards:   { type: [mongoose.Schema.Types.Mixed], default: [] },
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
