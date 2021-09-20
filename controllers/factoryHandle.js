const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const createAsync = require("../utils/createAsync");

exports.deleteOne = (Model) =>
  createAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndRemove(req.params.id);
    if (!doc) {
      return next(new AppError("No document found with such ID", 404));
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.createOne = (Model) =>
  createAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    if (!doc) {
      return next(new AppError("No document found with such ID", 404));
    }
    res.status(201).json({
      status: "sucess",
      data: {
        data: doc,
      },
    });
  });

exports.updateOne = (Model) =>
  createAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError("No document found with such ID", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  createAsync(async (req, res, next) => {
    //Filtering
    // const queryObj = { ...req.query };
    // const excludedFields = ["page", "sort", "limit", "fields"];
    // excludedFields.forEach((el) => delete queryObj[el]);
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gt|lt|lte|gte)\b/g, (match) => `$${match}`);
    // let query = Tour.find(JSON.parse(queryStr));

    //Sorting
    // if (req.query.sort) {
    //   query = query.sort(req.query.sort.split(",").join(" "));
    // } else {
    //   query = query.sort("-createdAt");
    // }

    //Field Limiting
    // if (req.query.fields) {
    //   query = query.select(req.query.fields.split(",").join(" "));
    // } else {
    //   query = query.select("-__v");
    // }

    //Pagination
    // const page = parseInt(req.query.page, 10) || 1;
    // const limit = parseInt(req.query.limit, 10) || 100;
    // const skip = (page - 1) * limit;
    // if (req.query.page) {
    //   const newTours = await Tour.countDocuments();
    //   if (skip >= newTours) {
    //     throw new Error("Invalid page number");
    //   }
    // }
    // query = query.skip(skip).limit(limit);
    let filter = {}; //If filter is an empty object || there is no params.tourId, then it will return all the reviews.
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find({ filter }), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    res.status(200).json({
      status: "success",
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, populate) =>
  createAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populate) query = query.populate(populate);
    const doc = await query;
    if (!doc) {
      return next(new AppError("No document found with such ID", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });
