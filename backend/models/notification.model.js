const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, default: "" },
  isRead: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  type: { type: String, default: "generic" },
  meta: { type: Schema.Types.Mixed },
  createdOn: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
