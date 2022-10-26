const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const { response } = require("express");

//@description     Get all Messages
//@route           GET /api/message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json({"messages": messages});
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});




//@description     Create New Message
//@route           POST /api/message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, content_type } = req.body;

  if (!content || !chatId || !content_type) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    content_type: content_type,
    prev_message: ""
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic").execPopulate();
    message = await message.populate("chat").execPopulate();
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Delete one message
//@route           DELETE /api/message
//@access          Protected
const deleteMessage = asyncHandler(async (req, res) => {

  const { chatId, messageId } = req.body;
  if (!chatId || !messageId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  try {
    const message = await Message.find({ chat: chatId }).findOne({ _id: messageId })
    var messageTimestamp = new Date(message['createdAt']).getTime() / 1000
    var currentTimestamp = Date.now() / 1000

    if (currentTimestamp - messageTimestamp <= 1800) {
      const response = await Message.findByIdAndDelete({ chatId: chatId, _id: messageId })
      res.status(200).json({ "response": response, "status": "message deleted" })
    } else {
      res.status(400).json({ "status": "Message older than 30 min" })
    }
  } catch (error) {
    res.status(400).json({ "error": error.message });
    console.log(error.message)
    throw new Error(error.Message);
  }
})

//@description     Update one message
//@route           PUT /api/Message
//@access          Protected
const updateMessage = asyncHandler(async (req, res) => {
  const { chatId, messageId, content } = req.body;

  if (!chatId || !messageId || !content) {
    return res.status(400).json({ "error": "Provide chatId, messageId and content" })
  }

  try {
    const message = await Message.find({ chat: chatId }).findOne({ _id: messageId })
    var messageTimestamp = new Date(message['createdAt']).getTime() / 1000;
    var currentTimestamp = Date.now() / 1000;

    if (currentTimestamp - messageTimestamp <= 1800) {
      const response = await Message.findByIdAndUpdate({ chatId: chatId, _id: messageId }, { content: content }, function (err, docs) {
        if (err) {
          res.status(400).json({ "error": error.message });
        } else {
          res.status(200).json({
            "prev_response": docs,
            "new_response_content": content,
            "status": "Message updated"
          })
        }
      })
    } else {
      res.status(400).json({ "status": "Message older than 30 min" })
    }


  } catch (error) {
    res.status(400).json({ "error": error.message });
    console.log(error.message)
    throw new Error(error.Message);
  }
})

//@description     Reply to one message
//@route           PUT /api/message/reply
//@access          Protected
const replyMessage = asyncHandler(async (req, res) => {
  const { chatId, messageId, content, content_type } = req.body;

  if (!messageId || !chatId || !content || !content_type) {
    return res.status(400).json({ "error": "Provide valid chatId, messageId, content and content_type" })
  }

  var newMessageModal = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    content_type: content_type,
    prev_message: messageId
  };

  try {
    var prevMessage = await Message.find({ chat: chatId, _id: messageId })

    var newMessage = await Message.create(newMessageModal);

    newMessage = await newMessage.populate("sender", "name pic").execPopulate();
    newMessage = await newMessage.populate("chat").execPopulate();
    newMessage = await User.populate(newMessage, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage });

    res.status(200).json({
      "prevMessage": prevMessage,
      "newMessage": newMessage,
    })


  } catch (error) {
    res.status(400).json({ "error": error.message });
    console.log(error.message)
    throw new Error(error.Message);
  }
})


//@description     Forward one message
//@route           PUT /api/message/forward
//@access          Protected
const forwardMessage = asyncHandler(async (req, res) => {
  const { content, content_type, forwardChatId } = req.body;

  if ( !content || !content_type || !forwardChatId ) {
    return res.status(400).json({ "error": "Provide valid content, content_type and forwardChatId" })
  }

  try {

    var newMessageModal = {
      sender: req.user._id,
      content: content,
      chat: forwardChatId,
      content_type: content_type,
      prev_message: ""
    };

    var newMessage = await Message.create(newMessageModal);

    newMessage = await newMessage.populate("sender", "name pic").execPopulate();
    newMessage = await newMessage.populate("chat").execPopulate();
    newMessage = await User.populate(newMessage, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(forwardChatId, { latestMessage: newMessage });

    res.status(200).json(newMessage)
  } catch (error) {
    res.status(400).json({ "error": error.message });
    console.log(error.message)
    throw new Error(error.Message);
  }

})



module.exports = { allMessages, sendMessage, deleteMessage, updateMessage, replyMessage, forwardMessage };
