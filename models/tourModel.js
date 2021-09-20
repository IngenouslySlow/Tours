const mongoose = require("mongoose");
const slugify = require("slugify");
//Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "A name is required"],
      maxLength: [40, "A tour name must have less than 40 characters"],
      minLength: [10, "A tour name must have more than 10 characters"],
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 4.5,
      max: [5, "A tour must have a rating less than 5"],
      min: [1, "A tour must have a rating greater than 1"],
    },
    price: {
      type: Number,
      required: [true, "A price is required"],
    },
    duration: {
      type: Number,
      required: [true, "A duration is required"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A maxGroupSize is required"],
    },
    difficulty: {
      type: String,
      required: [true, "A difficulty is required"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "Discount price should be below the normal price",
      },
    },
    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    summary: {
      type: String,
      trim: true,
      required: [true, "A summary is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "An image is required"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Virtual property
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//Pre-save hook
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Post-save hook
// tourSchema.post("save", function (doc, next) {
//   console.log(doc);
//   next();
// });

//Query Middleware
//Pre-find Hook
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt ",
  });
  next();
});

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.virtual("reviews", {
  ref: "Review", // This is the name of the model that we want to reference.
  localField: "_id", // This is the field that we want to match.
  foreignField: "tour", // This is the field that we specified in the review model to reference the tour
});

//Post-find hook
// tourSchema.post(/^find/, function (docs, next) {
//   const time = this.start - Date.now();
//   console.log(`The operation took ${time} milliseconds`);
//   next();
// });

//Aggregation Middleware
tourSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // console.log(this.pipeline()); //Logs the entire aggregation pipeline
  next();
});

//Model
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
