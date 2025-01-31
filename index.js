const port = 4900;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const OrderRoutes = require('./Routes/orderRoute');
// const OrderModal = require('./models/OrderModal'); // Your Mongoose model
const OrderSchema = require("./models/OrderModal"); // Define your Order model
const crypto = require('crypto');
const axios = require('axios');
const qs = require('qs');
const Order = require('./models/OrderModal');  // Ensure the path to Order model is correct

const distributorRoutes = require("./Routes/distributorRoutes");
const distributorApplicationRoutes = require("./Routes/distributorApplicationRoutes");
// Importing Product Model

const Product = require("./models/Product");
const jwt  = require("jsonwebtoken");

// Middleware for parsing JSON and handling CORS



app.use(cors({
  origin: ["http://localhost:3000", "https://exerenergy.com"], // Add frontend domains here
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use(cors()); 
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));


// schema models 

const UserSchema = require("./models/UserSchema");
// Routes
app.use('/distributor', distributorRoutes);
app.use('/applydistributor',distributorApplicationRoutes);



// Key
// // use your secret key  as well as your database username and password here as a value for the variables created.

const secretKey = process.env.JWT_SECRET;
const  DB_UserName = process.env.DB_UserName;
const DB_Password = process.env.DB_Password;

//======================================================================== Connect to MongoDB
// // use your database username and passsword 


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));



//========================================================================= Base API 

app.get("/",(req,res) => {
    res.send(" Hello, Express App is Running");
    res.send(" Hello");
});



//=========================for fetching the orders from backend ===============================================//









// Routes
app.use('/orders', OrderRoutes);






// Fetch all orders for the authenticated user
// app.get('/orders/user-orders', jwt, async (req, res) => {
//   try {
//     const userId = req.user.id; // Get user ID from token
//     const orders = await OrderModal.find({ userId }); // Fetch orders associated with the user ID

//     if (!orders || orders.length === 0) {
//       return res.status(404).json({ success: false, message: 'No orders found.' });
//     }

//     res.status(200).json({ success: true, orders });
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
//   }
// });









// Ensure the upload directory exists

const uploadDir = path.join(__dirname, "upload", "images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Image Storage Engine Configuration with Multer

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save images in the 'upload/images' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.originalname.split(".")[0] +
        "_" +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  },
});

// Initialize Multer with the storage configuration

const upload = multer({ storage });

// Serve uploaded images as static files

app.use("/images", express.static(uploadDir));

// ===================================================================== Combined Endpoint for uploading images and adding a new product in the ADMIN Pannel

app.post("/addproduct", upload.array("images", 10), async (req, res) => {
  try {

    // Map uploaded file paths to full image URLs
    const imageUrls = req.files.map((file) => {
      return `https://exerbackend-cm9f.vercel.app/images/${file.filename}`;
    });

    // Parse JSON strings for colors and tags
    const colors = JSON.parse(req.body.colors);
    const tags = JSON.parse(req.body.tags);

    // Determine the next product ID
    let products = await Product.find({});
    let id = products.length > 0 ? products.slice(-1)[0].id + 1 : 1;

    // Create and save the new product
    const product = new Product({
      id: id,
      name: req.body.name,
      image: imageUrls,  // Use the full image URLs obtained from the uploaded files
      description: req.body.description,
      price: req.body.price,
      old_price: req.body.old_price,
      bestSeller: req.body.bestSeller,
      colors: colors,  // Array of colors
      inStock: req.body.inStock,
      category: req.body.category,
      tags: tags,  // Array of tags
    });

    console.log('Product : ', product);
    await product.save();
    console.log('Product Added Successfully.');

    // Respond with success
    res.json({
      success: true,
      message: "Product added successfully",
      product: {
        name: req.body.name,
        image: imageUrls,
      },
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
});

// =====================================================================  Endpoint for deleting a product by ID in the ADMIN Pannel

app.post("/removeproduct", async (req, res) => {
  try {

    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Product Removed");
    res.json({ success: true });

  } catch (error) {

    console.error("Error removing product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove product",
      error: error.message,
    });
  }
});

// =====================================================================  Endpoint for fetching all products from the database

app.get("/allproducts", async (req, res) => {
  try {

    let products = await Product.find({});
    
    console.log(`All Products Fetched: ${products.length}`);

    res.status(200).json(products);

} catch (error) {

    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// =====================================================================  Endpoint for registering the user 

app.post("/signup", async (req, res) => {
  try {
    let check = await UserSchema.findOne({ email: req.body.email });
    if (check) {
      return res.status(400).json({
        success: false,
        errors: "Existing user found with the same email ID",
      });
    }
    // Hash the password before storing it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    
    // Create a new user with the hashed password
    const User = new UserSchema({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword, // Store the hashed password
      cartData: [],
    });
    await User.save();
    console.log("User saved successfully");
    const data = {
      user: {
        Id: User._id,
      },
    };
    const token = jwt.sign(data, secretKey);
    res.json({
      success: true,
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Error saving user" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = await UserSchema.findOne({ email: req.body.email });

    if (user) {
      console.log("User found:", user);

      const passCompare = await bcrypt.compare(req.body.password, user.password);

      console.log("Password comparison result:", passCompare);

      if (passCompare) {
        const data = {
          user: {
            Id: user._id,
          },
        };
        const token = jwt.sign(data, secretKey);

        // Check if the user is an admin
        const role = user.email === "sales@exerenergy.com" ? "admin" : "user";

        res.json({ success: true, token, role });
        console.log(`${role} logged in successfully: `, data);
      } else {
        res.status(400).json({ success: false, errors: "Wrong password" });
      }
    } else {
      res.status(400).json({ success: false, errors: "Wrong Email ID" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, errors: "Error logging in" });
  }
});


// =====================================================================  Endpoint for adding products to the cart 

const fetchUser = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Extract token from Authorization header
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  // console.log("Token:", token);
  try {
    const decoded = jwt.verify(token, secretKey);
    // console.log("Decoded token:", decoded); 
    const user = await UserSchema.findById(decoded.user.Id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Error verifying token:", {
      message: error.message,
      stack: error.stack,
      token,
    });
    res.status(401).json({ message: "Invalid token" });
  }
};

app.post("/addToCart", fetchUser, async (req, res) => {
  console.log("Received request at /addToCart");

  const { product } = req.body;

  // Log the incoming product data to check if selectedBattery is present
  console.log("Product data received:", product);

  if (
    !product ||
    !product.id ||
    !product.name ||
    !product.selectedColor ||
    !product.selectedBattery ||  // Validate selectedBattery
    !product.category ||         // Validate category
    !product.image ||            // Validate image URL
    !product.price ||            // Validate price
    !product.quantity           // Validate quantity
  ) {
    return res.status(400).json({ message: "Invalid product data" });
  }

  try {
    let user = req.user; // User is already attached by the fetchUser middleware
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Checking if the product already exists in the cart...");

    // Check if product is already in the cart (based on id, color, and battery)
    const existingProductIndex = user.cartData.findIndex(
      (item) =>
        item.id.toString() === product.id.toString() &&
        item.selectedColor === product.selectedColor     &&  
        item.selectedBattery === product.selectedBattery
    );

    if (existingProductIndex > -1) {
      // Update quantity of existing product in the cart
      user.cartData[existingProductIndex].quantity += product.quantity;
      user.markModified("cartData");
    } else {
      // Add new product to the cart
      user.cartData.push(product);
    }

    // Save the updated user document
    await user.save();
    res.status(200).json({ message: "Product added to cart", cartData: user.cartData });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ message: "Error adding product to cart", error });
  }
});

// app.post("/addToCart", async (req, res) => {
//   console.log("Received request at /addToCart");

//   const { product, isGuest } = req.body;

//   // Log the incoming product data to check if selectedBattery is present
//   console.log("Product data received:", product);

//   if (
//     !product ||
//     !product.id ||
//     !product.name ||
//     !product.selectedColor ||
//     !product.selectedBattery || // Validate selectedBattery
//     !product.category ||        // Validate category
//     !product.image ||           // Validate image URL
//     !product.price ||           // Validate price
//     !product.quantity           // Validate quantity
//   ) {
//     return res.status(400).json({ message: "Invalid product data" });
//   }

//   try {
//     if (isGuest) {
//       // For guest users, send the product data back to the client
//       console.log("Guest user: Returning product to client for local storage");
//       return res.status(200).json({ message: "Product added to cart (guest)", product });
//     }

//     // For authenticated users, use the fetchUser middleware
//     let user = req.user; // User is already attached by the fetchUser middleware
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     console.log("Checking if the product already exists in the cart...");

//     // Check if product is already in the cart (based on id, color, and battery)
//     const existingProductIndex = user.cartData.findIndex(
//       (item) =>
//         item.id.toString() === product.id.toString() &&
//         item.selectedColor === product.selectedColor &&
//         item.selectedBattery === product.selectedBattery
//     );

//     if (existingProductIndex > -1) {
//       // Update quantity of existing product in the cart
//       user.cartData[existingProductIndex].quantity += product.quantity;
//       user.markModified("cartData");
//     } else {
//       // Add new product to the cart
//       user.cartData.push(product);
//     }

//     // Save the updated user document
//     await user.save();
//     res.status(200).json({ message: "Product added to cart", cartData: user.cartData });
//   } catch (error) {
//     console.error("Error adding product to cart:", error);
//     res.status(500).json({ message: "Error adding product to cart", error });
//   }
// });









app.post("/removeFromCart", fetchUser, async (req, res) => {
  console.log("Received request at /removeFromCart");

  const { productId, selectedColor, selectedBattery } = req.body;

  // Check if productId, selectedColor, and selectedBattery are provided
  if (!productId || !selectedColor || !selectedBattery) {
    return res.status(400).json({ message: "Invalid product data" });
  }

  try {
    let user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user);

    // Find the index of the product in the cartData array (matching id, color, and battery)
    const productIndex = user.cartData.findIndex(
      (item) =>
        item.id.toString() === productId.toString() &&
        item.selectedColor === selectedColor &&
        item.selectedBattery === selectedBattery // Compare battery as well
    );

    if (productIndex > -1) {
      // Remove the product from the cartData array
      user.cartData.splice(productIndex, 1);
      user.markModified("cartData");

      // Save the updated user document
      await user.save();
      console.log("Product removed from cart successfully");
      res.status(200).json({
        message: "Product removed from cart",
        cartData: user.cartData,
      });
    } else {
      console.log("Product not found in cart");
      res.status(404).json({ message: "Product not found in cart" });
    }
  } catch (error) {
    console.error("Error removing product from cart:", error);
    res.status(500).json({ message: "Error removing product from cart", error });
  }
});


app.get("/getCartData", fetchUser, async (req, res) => {
  try {
    let user = req.user;
    if (user) {
      return res.status(200).json({ success: true, cartData: user.cartData });
    }
    return res.status(404).json({ message: "User not found" });
  } catch (error) {
    console.error("Error fetching cart data:", error);
    res.status(500).json({ success: false, message: "Error fetching cart data", error });
  }
});





// // Save Order to Database Function
// const saveOrderToDatabase = async (orderData) => {
//   try {
//     const order = new Order(orderData);
//     await order.save();
//     console.log('Order saved successfully:', order);
//     return { success: true, order };
//   } catch (error) {
//     console.error('Error saving order to database:', error);
//     return { success: false, message: error.message };
//   }
// };


// // Environment variables (put these in a `.env` file)
// const { EASEBUZZ_KEY, EASEBUZZ_BASE_URL  } = process.env;

// const generateHash = (data) => {
//   const hashString = `${data.key}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}|||||||||||${process.env.EASEBUZZ_SALT}`;
//   console.log("Hash String:", hashString);
//   return crypto.createHash('sha512').update(hashString).digest('hex');
// };

// // Route to initialize Easebuzz payment
// app.post('/easebuzz/initiate',fetchUser, async (req, res) => {
//   try {
//     const { amount, firstname, email, phone, productinfo } = req.body;

//     if (!amount || !firstname || !email || !phone || !productinfo) {
//       return res.status(400).json({ success: false, message: 'Invalid input data.' });
//     }

//     const txnid = `TXN${Date.now()}`;
//     const data = {
//       key: EASEBUZZ_KEY,
//       txnid,
//       amount: parseFloat(amount).toFixed(2),
//       productinfo: productinfo.trim(),
//       firstname: firstname.trim(),
//       email: email.trim(),
//       phone: phone.trim(),
//       surl: "http://localhost:4900/success",
//       furl: "http://localhost:4900/failed",
//     };

//     console.log('Request Data:', data);

//     // Generate hash
//     const hash = generateHash(data);
//     data.hash = hash;

//     console.log('Hash String:', hash);

//     const easebuzzUrl = `${EASEBUZZ_BASE_URL}/payment/initiateLink`;

//     const response = await axios.post(easebuzzUrl, qs.stringify(data), {
//       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     });
//     console.log('Easebuzz Response:', response.data);

//     if (response.data.status === 1) {
//       const paymentToken = response.data.data;
//       if (!paymentToken) {
//         console.error('Payment token is undefined');
//         res.status(500).json({ success: false, message: 'Payment token missing in Easebuzz response.' });
//         return;
//       }
    
//       // Store order details in the database
     
//       // Construct the payment URL
//       const paymentUrl = `https://testpay.easebuzz.in/pay/${paymentToken}`;
    
//       // // Option 1: Redirect directly from backend
//       // res.redirect(paymentUrl);
    
//       // send to database
//       res.json({ success: true, paymentUrl });
//       // Save the order in the database
//       const { items, amount, address, paymentMethod, payment } = req.body;
//       // Save the order in the database
//       const orderData = {
        
//         user: req.user._id, // Fetch user from middleware
//         items,
//         amount,
//         address,
//         paymentMethod,
//         payment,
//         status: "pending", // Default order status
//       };

//       const saveResult = await saveOrderToDatabase(orderData);
    

      
//     } else {
//       console.error('Easebuzz error:', response.data.error_desc);
//       res.status(400).json({ success: false, message: response.data.error_desc });
//     }
    
//   } catch (error) {
//     console.error('Error initiating Easebuzz payment:', error.response?.data || error.message);
//     res.status(500).json({ success: false, message: 'Failed to initiate payment.' });
//   }
  
// });



// Success route

app.post('/success', (req, res) => {
  const { txnid, status } = req.body;

  if (status === 'success') {
    console.log(`Payment Successful for Transaction ID: ${txnid}`);

    // Redirect with txnid and message as query parameters
    res.redirect(`https://365needs.com/success?txnid=${txnid}&message=Payment+was+successful`);
  } else {
    console.error(`Payment Failed for Transaction ID: ${txnid || 'unknown'}`);

    // Redirect with failure message
    res.redirect(`https://365needs.com/failed?txnid=${txnid || 'N/A'}&message=Payment+failed`);
  }
});





  

// // Route to handle payment failure callback
// app.get('/failed', (req, res) => {
//   const { txnid, status } = req.body;
//   res.status(400).json({ success: false, message: 'Payment failed', txnid });
// });













// =====================================================================  Start the server

app.listen( (err) => {
    if (!err) {
    console.log(`Server running on port ${port}`);
  } else {
    console.error("Error starting server:", err);
  }
});
