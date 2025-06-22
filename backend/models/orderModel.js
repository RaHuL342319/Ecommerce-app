import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: String,
      required: [true, "Order ID is required"],
      unique: true,
    },
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: "product",
    },
    productDetails: {
      type: String,
      image: Array,
    },
    paymentId: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      // enum: ["Pending", "Completed", "Failed"],
      default: "",
    },
    deliveryAddress: {
      type: mongoose.Schema.ObjectId,
      ref: "address",
    },
    subTotalAmt: {
      type: Number,
      default: 0,
    },
    totalAmt: {
      type: Number,
      default: 0,
    },
    invoiceReceipt: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);
const OrderModel = mongoose.model("order", orderSchema);
export default OrderModel;
