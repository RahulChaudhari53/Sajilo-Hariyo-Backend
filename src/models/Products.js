const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A product must have a name"],
      trim: true,
    },
    botanicalName: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "A product must belong to a category"],
    },
    family: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "A product must have a description"],
    },

    price: {
      type: Number,
      required: [true, "A product must have a price"],
    },
    // discountPrice: {
    //   type: Number,
    //   validate: {
    //     // Custom validator: Discount must be lower than actual price
    //     validator: function (val) {
    //       return val < this.price;
    //     },
    //     message: "Discount price ({VALUE}) should be below regular price",
    //   },
    // },
    discountPrice: {
      type: Number,
      validate: {
        validator: function (val) {
          // On update, `this.price` may not exist
          if (this.price === undefined) return true;
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // The "Care Profile" (Your UX Heuristic #6)
    careProfile: {
      difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Expert"],
        default: "Easy",
      },
      light: { type: String, default: "Indirect Light" },
      water: { type: String, default: "Weekly" },
      temperature: { type: String, default: "15°C - 30°C" },
      humidity: { type: String },
    },

    // Physical Attributes
    details: {
      height: { type: String }, // e.g. "12-15 inches"
      potSize: { type: String }, // e.g. "5 inch ceramic"
    },

    // Safety & Tags (Booleans for easy filtering)
    tags: {
      isPetFriendly: { type: Boolean, default: false },
      isAirPurifying: { type: Boolean, default: false },
      isTrending: { type: Boolean, default: false },
    },

    //  Media & Assets
    image: {
      type: String, // Main Cover Image (Thumbnail)
      required: [true, "A product must have a cover image"],
    },
    images: [String],

    arModel: {
      type: String, // URL to the .glb file
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Ensure virtuals show up
    toObject: { virtuals: true },
  }
);

productSchema.index({ name: "text", botanicalName: "text" });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
