import mongoose, { Schema, Document } from 'mongoose';

export interface IUserLocation extends Document {
  user: mongoose.Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  accuracy: number;
  updatedAt: Date;
  createdAt: Date;
}

const userLocationSchema = new Schema<IUserLocation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coords: number[]) {
            return coords.length === 2 && coords[0] >= -180 && coords[0] <= 180 && coords[1] >= -90 && coords[1] <= 90;
          },
          message: 'Invalid coordinates',
        },
      },
    },
    accuracy: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geospatial queries
userLocationSchema.index({ location: '2dsphere' });

// TTL index: automatically delete documents after 1 hour
userLocationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 3600 });

export const UserLocation = mongoose.model<IUserLocation>('UserLocation', userLocationSchema);
