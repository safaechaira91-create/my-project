import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const MessageSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ chatId: 1, createdAt: 1 });

const Message = models.Message || model('Message', MessageSchema);

export default Message;