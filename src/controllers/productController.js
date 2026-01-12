const Product = require("../models/Products");

// 1. Create Product (Admin)
exports.createProduct = async (req, res) => {
  try {
    // 1. Handle Files (Multer puts them in req.files)
    // req.files is an object like: { image: [file], arModel: [file] }

    let imagePath = "";
    let arModelPath = "";
    let galleryPaths = [];

    if (req.files) {
      if (req.files.image) {
        imagePath = req.files.image[0].path
          .replace(/\\/g, "/")
          .replace("public/", "");
      }
      if (req.files.arModel) {
        arModelPath = req.files.arModel[0].path
          .replace(/\\/g, "/")
          .replace("public/", "");
      }

      if (req.files.gallery) {
        galleryPaths = req.files.gallery.map((file) =>
          file.path.replace(/\\/g, "/").replace("public/", "")
        );
      }
    }

    if (!imagePath) {
      return res
        .status(400)
        .json({ status: "fail", message: "Cover image is required" });
    }

    // 2. Parse Text Data (Because FormData sends everything as strings)
    // We might need to manually construct the nested objects if Frontend sends flattened keys
    // For now, let's assume Frontend sends keys like "careProfile.difficulty" or we construct it here.

    // Simplest way: We expect the body to contain standard fields.
    // NOTE: In Postman/Flutter, you will send 'careProfile[difficulty]' or handle parsing here.

    const newProduct = await Product.create({
      ...req.body, // Name, price, stock, description, category

      // Explicitly map nested fields if they come as flat strings from FormData
      // (Depends on how you implement the Frontend Form)
      careProfile: {
        difficulty: req.body.difficulty || "Easy",
        light: req.body.light,
        water: req.body.water,
        temperature: req.body.temperature,
      },
      details: {
        height: req.body.height,
        potSize: req.body.potSize,
      },
      tags: {
        isPetFriendly: req.body.isPetFriendly === "true", // FormData sends boolean as string 'true'
        isAirPurifying: req.body.isAirPurifying === "true",
        isTrending: req.body.isTrending === "true",
      },

      image: imagePath,
      images: galleryPaths,
      arModel: arModelPath || undefined,
    });

    res.status(201).json({
      status: "success",
      data: { product: newProduct },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// 2. Get All Products (Public - With Filter & Search)
exports.getAllProducts = async (req, res) => {
  try {
    // Basic Filtering
    // 1A. Basic Filtering
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // FIX: Handle flat keys from Flutter/Dio (e.g., 'price[gte]': '0.0')
    // We need to convert them to nested objects: { price: { gte: 0.0 } }
    Object.keys(queryObj).forEach(key => {
      // Check for pattern like "field[operator]"
      const match = key.match(/^(.+)\[(.+)\]$/);
      if (match) {
        const field = match[1];
        const operator = match[2];
        
        if (!queryObj[field]) {
           queryObj[field] = {};
        }
        
        // Convert 'price' values to Number, otherwise keep as string
        let value = queryObj[key];
        if (field === 'price' || field === 'stock') {
           value = Number(value);
        }

        queryObj[field][operator] = value;
        delete queryObj[key]; // Remove the flat key
      }
    });

    // 1B. Advanced Filtering (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    
    let query = Product.find(JSON.parse(queryStr));

    // 2. Search Logic (Name or Botanical Name)
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: "i" };
      // Merge search into the query
      query = query.find({
        $or: [{ name: searchRegex }, { botanicalName: searchRegex }],
      });
    }

    // 3. Sorting
    if (req.query.sort) {
       const sortBy = req.query.sort.split(',').join(' ');
       query = query.sort(sortBy);
    } else {
       query = query.sort('-createdAt');
    }
    
    // Execute Query
    // .populate('category') fills in the Category details (like name) instead of just ID
    const products = await query.populate("category", "name");

    res.status(200).json({
      status: "success",
      results: products.length,
      data: { products },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// 3. Get Single Product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      return res
        .status(404)
        .json({ status: "fail", message: "Product not found" });
    }
    res.status(200).json({ status: "success", data: { product } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// 4. Update Product (Admin)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ status: "fail", message: "Product not found" });
    }

    // Convert string numbers to actual numbers (FormData sends everything as strings)
    if (req.body.price) {
      req.body.price = Number(req.body.price);
    }
    if (req.body.discountPrice) {
      req.body.discountPrice = Number(req.body.discountPrice);
    }
    if (req.body.stock !== undefined) {
      req.body.stock = Number(req.body.stock);
    }

    // Validate discountPrice against price (use new price if provided, otherwise old price)
    const priceToCompare =
      req.body.price !== undefined ? req.body.price : product.price;
    if (req.body.discountPrice !== undefined) {
      if (req.body.discountPrice >= priceToCompare) {
        return res.status(400).json({
          status: "fail",
          message: `Discount price (${req.body.discountPrice}) should be below regular price (${priceToCompare})`,
        });
      }
    }

    // Handle File Updates
    if (req.files) {
      if (req.files.image) {
        req.body.image = req.files.image[0].path
          .replace(/\\/g, "/")
          .replace("public/", "");
      }

      if (req.files.arModel) {
        req.body.arModel = req.files.arModel[0].path
          .replace(/\\/g, "/")
          .replace("public/", "");
      }

      if (req.files.gallery) {
        req.body.images = req.files.gallery.map((file) =>
          file.path.replace(/\\/g, "/").replace("public/", "")
        );
      }
    }

    // Handle nested objects (careProfile, details, tags)
    // Only update if fields are provided
    if (
      req.body.difficulty ||
      req.body.light ||
      req.body.water ||
      req.body.temperature ||
      req.body.humidity
    ) {
      req.body.careProfile = {
        difficulty:
          req.body.difficulty || product.careProfile?.difficulty || "Easy",
        light: req.body.light || product.careProfile?.light,
        water: req.body.water || product.careProfile?.water,
        temperature: req.body.temperature || product.careProfile?.temperature,
        humidity: req.body.humidity || product.careProfile?.humidity,
      };
      // Remove individual fields from req.body to avoid conflicts
      delete req.body.difficulty;
      delete req.body.light;
      delete req.body.water;
      delete req.body.temperature;
      delete req.body.humidity;
    }

    if (req.body.height || req.body.potSize) {
      req.body.details = {
        height: req.body.height || product.details?.height,
        potSize: req.body.potSize || product.details?.potSize,
      };
      // Remove individual fields from req.body
      delete req.body.height;
      delete req.body.potSize;
    }

    if (
      req.body.isPetFriendly !== undefined ||
      req.body.isAirPurifying !== undefined ||
      req.body.isTrending !== undefined
    ) {
      req.body.tags = {
        isPetFriendly:
          req.body.isPetFriendly !== undefined
            ? req.body.isPetFriendly === "true" ||
              req.body.isPetFriendly === true
            : product.tags?.isPetFriendly || false,
        isAirPurifying:
          req.body.isAirPurifying !== undefined
            ? req.body.isAirPurifying === "true" ||
              req.body.isAirPurifying === true
            : product.tags?.isAirPurifying || false,
        isTrending:
          req.body.isTrending !== undefined
            ? req.body.isTrending === "true" || req.body.isTrending === true
            : product.tags?.isTrending || false,
      };
      // Remove individual fields from req.body
      delete req.body.isPetFriendly;
      delete req.body.isAirPurifying;
      delete req.body.isTrending;
    }

    // Update product with all changes
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: false,
      }
    );

    res.status(200).json({
      status: "success",
      data: { product: updatedProduct },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// 5. Delete Product (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ status: "fail", message: "Product not found" });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
