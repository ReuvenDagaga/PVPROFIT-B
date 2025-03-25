import mongoose, { Schema, Document } from "mongoose";
import { Email } from "../interfaces/Email";

const EmailSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Emails = mongoose.model<Email>("Emails", EmailSchema);
