import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const ChatSchema = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: [
        {
          validator: (v) => Array.isArray(v) && v.length >= 2,
          message: 'Chat must contain at least two participants',
        },
        {
          validator: (v) => new Set(v.map((id) => String(id))).size === v.length,
          message: 'Participants must be unique',
        },
      ],
    },
    participantNames: {
      type: Map,
      of: String,
      default: {},
    },
    lastMessage: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
  },
  { timestamps: true }
);

ChatSchema.index({ participants: 1, updatedAt: -1 });

const Chat = models.Chat || model('Chat', ChatSchema);

export default Chat;