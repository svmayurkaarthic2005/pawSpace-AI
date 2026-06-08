import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type MessageContentType = 'text' | 'image' | 'ai_suggestion';

export interface IMessageContent {
  type: MessageContentType;
  text?: string;
  mediaUrl?: string;
  publicId?: string;
}

export interface IReadReceipt {
  user: mongoose.Types.ObjectId;
  readAt: Date;
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: IMessageContent;
  readBy: IReadReceipt[];
  deliveredTo: mongoose.Types.ObjectId[];
  isDeleted: boolean;
  deletedFor: mongoose.Types.ObjectId[]; // soft delete per user
  replyTo?: mongoose.Types.ObjectId; // future: reply to message
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageModel extends Model<IMessage> {}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const messageContentSchema = new Schema<IMessageContent>(
  {
    type: {
      type: String,
      enum: ['text', 'image', 'ai_suggestion'],
      required: true,
      default: 'text',
    },
    text: { type: String, maxlength: [4000, 'Message too long'], default: null },
    mediaUrl: { type: String, default: null },
    publicId: { type: String, default: null },
  },
  { _id: false },
);

const readReceiptSchema = new Schema<IReadReceipt>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const messageSchema = new Schema<IMessage, IMessageModel>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'Chat reference is required'],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    content: {
      type: messageContentSchema,
      required: true,
    },
    readBy: {
      type: [readReceiptSchema],
      default: [],
    },
    deliveredTo: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Paginate messages in a chat chronologically
messageSchema.index({ chat: 1, createdAt: 1 });
// Sender's messages
messageSchema.index({ sender: 1, createdAt: -1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

messageSchema.virtual('displayText').get(function (this: IMessage) {
  if (this.isDeleted) return 'This message was deleted';
  return this.content.text ?? '';
});

messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Message = mongoose.model<IMessage, IMessageModel>('Message', messageSchema);
