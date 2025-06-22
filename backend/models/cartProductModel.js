import mongoose from "mongoose";

const cartProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: "product",
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

const CartProductModel = mongoose.model("cartProduct", cartProductSchema);
export default CartProductModel;
