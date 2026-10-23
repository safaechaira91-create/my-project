import asyncHandler from 'express-async-handler';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';

const MAX_PARTICIPANTS = 10;

const normalizeParticipants = (participants = []) =>
  [...new Set(participants.map((value) => String(value).trim()).filter(Boolean))].sort();

export const getChats = asyncHandler(async (req, res) => {
  const authenticatedUserId = String(req.user?._id || '').trim();
  const requestedUserId = String(req.query.userId || authenticatedUserId).trim();

  if (requestedUserId !== authenticatedUserId) {
    res.status(403);
    throw new Error('Not allowed to view chats for another user');
  }

  const userId = authenticatedUserId;
  if (!userId) {
    res.status(400);
    throw new Error('userId is required');
  }

  const chats = await Chat.find({
    participants: userId,
  })
    .populate('participants', 'name image email')
    .sort({ updatedAt: -1 })
    .lean();

  res.json(chats);
});

export const createChat = asyncHandler(async (req, res) => {
  const authenticatedUserId = String(req.user?._id || '').trim();
  const participants = normalizeParticipants(req.body.participants);

  if (participants.length < 2) {
    res.status(400);
    throw new Error('At least two participants are required');
  }

  if (participants.length > MAX_PARTICIPANTS) {
    res.status(400);
    throw new Error(`A chat cannot have more than ${MAX_PARTICIPANTS} participants`);
  }

  const invalidParticipant = participants.find((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidParticipant) {
    res.status(400);
    throw new Error('One or more participant ids are invalid');
  }

  if (!participants.includes(authenticatedUserId)) {
    res.status(403);
    throw new Error('You can only create chats that include your account');
  }

  let chat = await Chat.findOne({
    participants: { $all: participants },
    $expr: { $eq: [{ $size: '$participants' }, participants.length] },
  }).populate('participants', 'name image email');

  if (chat) {
    res.json(chat);
    return;
  }

  const participantNames =
    typeof req.body.participantNames === 'object' && req.body.participantNames !== null
      ? req.body.participantNames
      : {};

  chat = await Chat.create({
    participants,
    participantNames,
    lastMessage: '',
  });

  const populatedChat = await Chat.findById(chat._id).populate('participants', 'name image email');

  res.status(201).json(populatedChat);
});

export const getMessagesByChat = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.chatId)) {
    res.status(400);
    throw new Error('Invalid chat id');
  }

  const chat = await Chat.findById(req.params.chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  const authenticatedUserId = String(req.user?._id || '').trim();
  const isParticipant = chat.participants.some(
    (p) => String(p._id || p) === authenticatedUserId
  );

  if (!isParticipant) {
    res.status(403);
    throw new Error('Not allowed to view messages for this chat');
  }

  const messages = await Message.find({
    chatId: req.params.chatId,
  })
    .sort({ createdAt: 1 })
    .lean();

  res.json(messages);
});

export const createMessage = asyncHandler(async (req, res) => {
  const { chatId, senderId, text } = req.body;
  const trimmedText = String(text || '').trim();

  if (trimmedText.length > 2000) {
    res.status(400);
    throw new Error('Message is too long');
  }

  const authenticatedUserId = String(req.user?._id || '').trim();

  if (!chatId || !senderId || !trimmedText) {
    res.status(400);
    throw new Error('chatId, senderId and text are required');
  }

  if (String(senderId) !== authenticatedUserId) {
    res.status(403);
    throw new Error('You can only send messages as the authenticated user');
  }

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    res.status(400);
    throw new Error('Invalid chat id');
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  const isParticipant = chat.participants.some(
    (p) => String(p._id || p) === authenticatedUserId
  );

  if (!isParticipant) {
    res.status(403);
    throw new Error('Not allowed to send messages to this chat');
  }

  const message = await Message.create({
    chatId,
    senderId: authenticatedUserId,
    text: trimmedText,
  });

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: trimmedText,
    updatedAt: new Date(),
  });

  res.status(201).json(message);
});