const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
      $or: [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ],
    }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send({ "users": users });
});

//@description     Register new user
//@route           POST /api/user/
//@access          Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Feilds");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

//@description     Auth the user
//@route           POST /api/users/login
//@access          Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

const userOnline = asyncHandler(async (req, res) => {
  try {
    const { usedrId } = req.body;

    await User.findByIdAndUpdate(usedrId, { isOnline: true })

    res.status(200).json({
      "user_id": usedrId,
      "isOnline": true
    })
  } catch (error) {
    res.status(400).json({
      "error": error
    });
    console.log(error);
  }
})

const userOffline = asyncHandler(async (req, res) => {
  try {
    const { usedrId } = req.body;

    await User.findByIdAndUpdate(usedrId, { isOnline: false })

    res.status(200).json({
      "user_id": usedrId,
      "isOnline": false
    })
  } catch (error) {
    res.status(400).json({
      "error": error
    });
    console.log(error);
  }
})

module.exports = { allUsers, registerUser, authUser, userOnline, userOffline };
