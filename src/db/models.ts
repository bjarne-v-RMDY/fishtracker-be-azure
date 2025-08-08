import mongoose from "mongoose";

// Device Schema
const deviceSchema = new mongoose.Schema({
  deviceIdentifier: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fish: [{
    fish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fish',
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    },
    fishId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Fish Images Schema
const fishImageSchema = new mongoose.Schema({
  fishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fish',
    required: true
  },
  imageBlob: {
    type: Buffer,
    required: true
  }
}, {
  timestamps: true
});

// Fish Colors Schema
const fishColorSchema = new mongoose.Schema({
  fishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fish',
    required: true
  },
  colorName: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Predators Schema
const predatorSchema = new mongoose.Schema({
  fishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fish',
    required: true
  },
  predatorName: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Fun Facts Schema
const funFactSchema = new mongoose.Schema({
  fishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fish',
    required: true
  },
  funFactDescription: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Fish Schema
const fishSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: false // Made optional since AI-analyzed fish don't need a device
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  captureTimestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  family: {
    type: String,
    required: true,
    trim: true
  },
  minSize: {
    type: Number,
    required: true,
    min: 0
  },
  maxSize: {
    type: Number,
    required: true,
    min: 0,
  },
  waterType: {
    type: String,
    required: true,
    enum: ['Freshwater', 'Saltwater', 'Brackish'],
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  colorDescription: {
    type: String,
    required: true,
    trim: true
  },
  depthRangeMin: {
    type: Number,
    required: true,
    min: 0
  },
  depthRangeMax: {
    type: Number,
    required: true,
    min: 0,
  },
  environment: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: String,
    required: true,
    trim: true
  },
  conservationStatus: {
    type: String,
    required: true,
    enum: ['Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered', 'Extinct in the Wild', 'Extinct', 'Data Deficient'],
    trim: true
  },
  consStatusDescription: {
    type: String,
    required: true,
    trim: true
  },
  favoriteIndicator: {
    type: Boolean,
    default: false
  },
  aiAccuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Create Models
const Device = mongoose.model('Device', deviceSchema);
const Fish = mongoose.model('Fish', fishSchema);
const FishImage = mongoose.model('FishImage', fishImageSchema);
const FishColor = mongoose.model('FishColor', fishColorSchema);
const Predator = mongoose.model('Predator', predatorSchema);
const FunFact = mongoose.model('FunFact', funFactSchema);

// Export all models
export {
  Device,
  Fish,
  FishImage,
  FishColor,
  Predator,
  FunFact
};
