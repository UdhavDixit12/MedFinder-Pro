import mongoose from 'mongoose';

/**
 * A user's saved facility. Facilities themselves live in OpenStreetMap;
 * we store only the stable OSM identifier plus a small snapshot taken at
 * save time so the dashboard can render without a live Overpass call.
 */
const favouriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    osmType: { type: String, enum: ['node', 'way', 'relation'], required: true },
    osmId: { type: Number, required: true, min: 1 },
    snapshot: {
      name: { type: String, default: null, maxlength: 200 },
      category: { type: String, default: 'other', maxlength: 40 },
      categoryLabel: { type: String, default: null, maxlength: 60 },
      lat: { type: Number, required: true, min: -90, max: 90 },
      lon: { type: Number, required: true, min: -180, max: 180 },
      address: { type: String, default: null, maxlength: 300 },
      phones: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = `${ret.osmType}/${ret.osmId}`;
        ret.favouriteId = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.user;
        return ret;
      },
    },
  },
);

favouriteSchema.index({ user: 1, osmType: 1, osmId: 1 }, { unique: true });

export default mongoose.models.Favourite || mongoose.model('Favourite', favouriteSchema);
