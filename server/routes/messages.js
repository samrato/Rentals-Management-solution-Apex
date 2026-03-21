const express = require('express');
const router = express.Router();
const { Message } = require('../models');

// Get all messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().populate('sender', 'name');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/messages', async (req, res) => {
  try {
    const message = new Message({
      sender: req.user.id,
      content: req.body.content
    });
    await message.save();
    const populated = await Message.findById(message._id).populate('sender', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
