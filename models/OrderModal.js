const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the User model
      ref: 'User', // Assuming the User model is named 'User'
      required: true,
    },
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        selectedBattery: { type: String, required: true },
      },
    ],
    amount: { type: Number, required: true },
    address: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipcode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['easebuzz', 'cod'], // Only allow 'easebuzz' or 'cod'
      required: true,
    },
    payment: {
      type: Object,
      default: {},
      validate: {
        validator: function (value) {
          // Ensure payment details exist for easebuzz
          return this.paymentMethod === 'cod' || 
                 (this.paymentMethod === 'easebuzz' && Object.keys(value).length > 0);
        },
        message: 'Payment details are required for Easebuzz payments',
      },
    },
    txnid: { 
      type: String, 
      unique: true, 
      sparse: true, // Ensure unique only if present
    },
    status: { 
      type: String, 
      default: 'pending',
      enum: ['pending', 'completed', 'cancelled'], // Allow specific statuses
    },
    createdAt: { 
      type: Date, 
      default: Date.now,
    },
  },
  { timestamps: true }
);

OrderSchema.pre('validate', function (next) {
  // Validate items for 'easebuzz' payments
  if (this.paymentMethod === 'easebuzz' && (!this.items || this.items.length === 0)) {
    return next(new Error('Items are required for Easebuzz payments.'));
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);




























// // const mongoose = require('mongoose');

// // const OrderSchema = new mongoose.Schema(
// //   {
// //     user: {
// //       type: mongoose.Schema.Types.ObjectId, // Reference to the User model
// //       ref: 'User', // Assuming the User model is named 'User'
      
// //     },
// //     items: [
// //       {
// //         name: { type: String,  },
// //         price: { type: Number,  },
// //         quantity: { type: Number,  },
// //       },
// //     ],
// //     amount: { type: Number,  },
// //     address: {
// //       firstName: { type: String,  },
// //       lastName: { type: String,  },
// //       email: { type: String,  },
// //       street: { type: String,  },
// //       city: { type: String,  },
// //       state: { type: String,  },
// //       zipcode: { type: String,  },
// //       country: { type: String,  },
// //       phone: { type: String,  },
// //     },
// //     paymentMethod: { type: String,  },
// //     payment: { type: Boolean, default: false },
// //     status: { type: String, default: 'Pending' },


// //     txnid: { type: String, unique: true },
// //     items: { type: Array, default: [] },
// //     amount: { type: Number,  },
// //     status: { type: String, default: 'pending' },
// //     paymentMethod: { type: String, default: 'easebuzz' },
// //     payment: { type: Object, default: {} },
// //     createdAt: { type: Date, default: Date.now },
    

// //   },
// //   { timestamps: true }
// // );

// // module.exports = mongoose.model('Order', OrderSchema);



// const mongoose = require('mongoose');

// const OrderSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId, // Reference to the User model
//       ref: 'User', // Assuming the User model is named 'User'
//     },
//     items: [
//       {
//         name: { type: String },
//         price: { type: Number },
//         quantity: { type: Number },
//       },
//     ],
//     amount: { type: Number },
//     address: {
//       firstName: { type: String },
//       lastName: { type: String },
//       email: { type: String },
//       street: { type: String },
//       city: { type: String },
//       state: { type: String },
//       zipcode: { type: String },
//       country: { type: String },
//       phone: { type: String },
//     },
//     paymentMethod: { 
//       type: String, 
//       enum: ['easebuzz', 'cod'], // Only allow 'easebuzz' or 'cod'
//       required: true 
//     },
//     payment: { 
//       type: Object, 
//       default: {}, 
//       validate: {
//         validator: function (value) {
//           // If payment method is 'easebuzz', ensure payment details exist
//           return this.paymentMethod === 'cod' || (this.paymentMethod === 'easebuzz' && Object.keys(value).length > 0);
//         },
//         message: 'Payment details are required for Easebuzz payments',
//       },
//     },
//     items: [
//       {
//         name: { type: String },
//         price: { type: Number },
//         quantity: { type: Number },
//       },
//     ], // Default status
//     status: { type: String, default: 'pending' }, // Default status
//     txnid: { type: String, unique: true, sparse: true }, // Only for online payments
//     createdAt: { type: Date, default: Date.now },
//   },
//   { timestamps: true }
// );

// // Export the schema
// module.exports = mongoose.model('Order', OrderSchema);
