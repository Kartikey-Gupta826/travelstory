require("dotenv").config();

// const fs = require("fs");
// const path = require("path");

// const uploadDir = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const upload = require("./multer");

const { authenticateToken } = require("./utilities");

const User = require("./models/user.model");
const TravelStory = require("./models/travelStory.model");
const Group = require("./models/group.model");
const Notification = require("./models/notification.model");
const Announcement = require("./models/announcement.model");

const imagekit = require("./imagekit");

mongoose.connect(process.env.MONGO_URI);

const app = express();
app.use(express.json());
app.use(cors({ origin: "https://travelstory-nine.vercel.app" }));

// Create Account
app.post("/create-account", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }

  const isUser = await User.findOne({ email });
  if (isUser) {
    return res
      .status(400)
      .json({ error: true, message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    fullName,
    email,
    password: hashedPassword,
  });

  await user.save();

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "72h",
    }
  );

  return res.status(201).json({
    error: false,
    user: { fullName: user.fullName, email: user.email },
    accessToken,
    message: "Registration Successful",
  });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and Password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid Credentials" });
  }

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "72h",
    }
  );

  return res.json({
    error: false,
    message: "Login Successful",
    user: { fullName: user.fullName, email: user.email },
    accessToken,
  });
});

// Get User
app.get("/get-user", authenticateToken, async (req, res) => {
  const { userId } = req.user;

  const isUser = await User.findOne({ _id: userId });

  if (!isUser) {
    return res.sendStatus(401);
  }

  return res.json({
    user: isUser,
    message: "",
  });
});

// Route to handle image upload
app.post("/image-upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: true, message: "No image uploaded" });
    }

    //   // const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;
    //   const imageUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;

    //   res.status(200).json({ imageUrl });
    // } catch (error) {
    //   res.status(500).json({ error: true, message: error.message });
    // }
    const result = await imagekit.upload({
      file: req.file.buffer,        // multer memory storage
      fileName: req.file.originalname,
      folder: "/travelstory",
    });

    res.status(200).json({
      imageUrl: result.url,
      imageFileId: result.fileId,
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// // Delete an image from uploads folder
// app.delete("/delete-image", async (req, res) => {
//   const { imageUrl } = req.query;

//   if (!imageUrl) {
//     return res
//       .status(400)
//       .json({ error: true, message: "imageUrl parameter is required" });
//   }

//   try {
//     // Extract the filename from the imageUrl
//     const filename = path.basename(imageUrl);

//     // Define the file path
//     const filePath = path.join(__dirname, "uploads", filename);

//     // Check if the file exists
//     if (fs.existsSync(filePath)) {
//       // Delete the file from the uploads folder
//       fs.unlinkSync(filePath);
//       res.status(200).json({ message: "Image deleted successfully" });
//     } else {
//       res.status(200).json({ error: true, message: "Image not found" });
//     }
//   } catch (error) {
//     res.status(500).json({ error: true, message: error.message });
//   }
// });

// // Serve static files from the uploads and assets directory
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use("/assets", express.static(path.join(__dirname, "assets")));

app.delete("/delete-image", authenticateToken, async (req, res) => {
  const { imageFileId } = req.query;

  if (!imageFileId) {
    return res.status(400).json({
      error: true,
      message: "imageFileId is required",
    });
  }

  try {
    await imagekit.deleteFile(imageFileId);

    res.status(200).json({
      message: "Image deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
});

// Add Travel Story
app.post("/add-travel-story", authenticateToken, async (req, res) => {
  const { title, story, visitedLocation, imageUrl, imageFileId, visitedDate } = req.body;
  const { userId } = req.user;

  // Validate required fields
  if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }

  // Convert visitedDate from milliseconds to Date object
  const parsedVisitedDate = new Date(parseInt(visitedDate));

  try {
    const travelStory = new TravelStory({
      title,
      story,
      visitedLocation,
      userId,
      imageUrl,
      imageFileId,
      visitedDate: parsedVisitedDate,
    });

    await travelStory.save();
    res.status(201).json({ story: travelStory, message: "Added Successfully" });
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
});

// Get All Travel Stories
app.get("/get-all-stories", authenticateToken, async (req, res) => {
  const { userId } = req.user;

  try {
    const travelStories = await TravelStory.find({ userId: userId }).sort({
      isFavourite: -1,
    });
    res.status(200).json({ stories: travelStories });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Edit Travel Story
app.put("/edit-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, story, visitedLocation, imageUrl, imageFileId, visitedDate } = req.body;
  const { userId } = req.user;

  // Validate required fields
  if (!title || !story || !visitedLocation || !visitedDate) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }

  // Convert visitedDate from milliseconds to Date object
  const parsedVisitedDate = new Date(parseInt(visitedDate));

  try {
    // Find the travel story by ID and ensure it belongs to the authenticated user
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found" });
    }

    const placeholderImgUrl = `${process.env.BASE_URL}/assets/placeholder.png`;

    travelStory.title = title;
    travelStory.story = story;
    travelStory.visitedLocation = visitedLocation;
    if (imageUrl) {
      travelStory.imageUrl = imageUrl || placeholderImgUrl;;
      travelStory.imageFileId = imageFileId;
    }
    travelStory.visitedDate = parsedVisitedDate;

    await travelStory.save();
    res.status(200).json({ story: travelStory, message: "Update Successful" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Delete a travel story
app.delete("/delete-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    // Find the travel story by ID and ensure it belongs to the authenticated user
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found" });
    }

    // Delete the travel story from the database
    await travelStory.deleteOne({ _id: id, userId: userId });

    // Extract the filename from the imageUrl
    // const imageUrl = travelStory.imageUrl;
    // const filename = path.basename(imageUrl);

    // // Define the file path
    // const filePath = path.join(__dirname, "uploads", filename);

    // // Delete the image file from the uploads folder
    // fs.unlink(filePath, (err) => {
    //   if (err) {
    //     console.error("Failed to delete image file:", err);
    //     // Optionally, you could still respond with a success status here
    //     // if you don't want to treat this as a critical error.
    //   }
    // });

    res.status(200).json({ message: "Travel story deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Update isFavourite
app.put("/update-is-favourite/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { isFavourite } = req.body;
  const { userId } = req.user;

  try {
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found" });
    }

    travelStory.isFavourite = isFavourite;

    await travelStory.save();
    res.status(200).json({ story: travelStory, message: "Update Successful" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Search travel stories
app.get("/search", authenticateToken, async (req, res) => {
  const { query } = req.query;
  const { userId } = req.user;

  if (!query) {
    return res.status(404).json({ error: true, message: "query is required" });
  }

  try {
    const searchResults = await TravelStory.find({
      userId: userId,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { story: { $regex: query, $options: "i" } },
        { visitedLocation: { $regex: query, $options: "i" } },
      ],
    }).sort({ isFavourite: -1 });

    res.status(200).json({ stories: searchResults });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Filter travel stories by date range
app.get("/travel-stories/filter", authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;

  const { userId } = req.user;

  try {
    // Convert startDate and endDate from milliseconds to Date objects
    const start = new Date(parseInt(startDate));
    const end = new Date(parseInt(endDate));

    // Find travel stories that belong to the authenticated user and fall within the date range
    const filteredStories = await TravelStory.find({
      userId: userId,
      visitedDate: { $gte: start, $lte: end },
    }).sort({ isFavourite: -1 });

    res.status(200).json({ stories: filteredStories });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Groups: create and list groups (members include creator)
app.post("/groups", authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  const { userId } = req.user;

  if (!name) return res.status(400).json({ error: true, message: "Group name is required" });

  try {
    const group = new Group({
      name,
      description: description || "",
      members: [userId],
      createdBy: userId,
    });

    await group.save();
    res.status(201).json({ group, message: "Group created" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

app.get("/groups", authenticateToken, async (req, res) => {

  const { userId } = req.user;
  try {
    // return groups where user is a member
    const groups = await Group.find({ members: userId }).populate("createdBy", "fullName email");
    res.status(200).json({ groups });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Notifications: create, list, clear
app.post("/notifications", authenticateToken, async (req, res) => {
  const { title, message, toUserId } = req.body;
  const { userId } = req.user;

  if (!title) return res.status(400).json({ error: true, message: "Notification title is required" });

  try {
    const notification = new Notification({
      userId: toUserId || userId,
      title,
      message: message || "",
      createdBy: userId,
    });

    await notification.save();
    res.status(201).json({ notification, message: "Notification created" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

app.get("/notifications", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const notifications = await Notification.find({ userId }).sort({ createdOn: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

app.delete("/notifications/clear", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    await Notification.deleteMany({ userId });
    res.status(200).json({ message: "Notifications cleared" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Recommendations: return users who have travel stories with overlapping locations
app.get("/recommendations", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const limit = parseInt(req.query.limit || "10");
  const skip = parseInt(req.query.skip || "0");

  try {
    // get all visited locations of current user
    const userStories = await TravelStory.find({ userId });
    const userLocationsSet = new Set();
    userStories.forEach((s) => {
      if (Array.isArray(s.visitedLocation)) {
        s.visitedLocation.forEach((l) => userLocationsSet.add(l));
      }
    });

    const userLocations = Array.from(userLocationsSet);
    if (userLocations.length === 0) {
      return res.status(200).json({ recommendations: [] });
    }

    // find travel stories by other users that have any overlapping location
    const matches = await TravelStory.find({
      visitedLocation: { $in: userLocations },
      userId: { $ne: userId },
    }).select("userId visitedLocation title visitedDate imageUrl");

    // get unique userIds preserving order
    const seen = new Set();
    const uniqueUserIds = [];
    matches.forEach((m) => {
      const id = m.userId.toString();
      if (!seen.has(id)) {
        seen.add(id);
        uniqueUserIds.push(id);
      }
    });

    const paged = uniqueUserIds.slice(skip, skip + limit);

    const recommendations = [];
    for (const uid of paged) {
      const user = await User.findById(uid).select("_id fullName email");
      // Get latest story for photo
      const latestStory = await TravelStory.findOne({ userId: uid }).sort({ visitedDate: -1 }).select("_id title visitedLocation visitedDate imageUrl");
      // Get a story with common locations
      const commonStory = await TravelStory.findOne({ userId: uid, visitedLocation: { $in: userLocations } }).select("_id title visitedLocation visitedDate imageUrl");
      const commonInterests = commonStory ? commonStory.visitedLocation.filter((l) => userLocationsSet.has(l)) : [];
      // Use latest story for display (has imageUrl)
      const displayStory = latestStory || commonStory;
      recommendations.push({ userInfo: user, commonInterests, commonStory: displayStory });
    }

    res.status(200).json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Find single person by email (used by Find People search)
app.get("/find-person", authenticateToken, async (req, res) => {
  const { email } = req.query;
  const { userId } = req.user;
  if (!email) return res.status(400).json({ error: true, message: "email is required" });

  try {
    const person = await User.findOne({ email });
    if (!person) return res.status(404).json({ error: true, message: "User not found" });

    // compute common locations
    const userStories = await TravelStory.find({ userId });
    const userLocationsSet = new Set();
    userStories.forEach((s) => { if (Array.isArray(s.visitedLocation)) s.visitedLocation.forEach(l => userLocationsSet.add(l)); });

    // Get latest story from this person (for their newest trip photo)
    const latestStory = await TravelStory.findOne({ userId: person._id }).sort({ visitedDate: -1 }).select("_id title visitedLocation visitedDate imageUrl");

    // Get a story with common locations if exists (for commonInterests display)
    const commonStory = await TravelStory.findOne({ userId: person._id, visitedLocation: { $in: Array.from(userLocationsSet) } }).select("_id title visitedLocation visitedDate imageUrl");
    const commonInterests = commonStory ? commonStory.visitedLocation.filter((l) => userLocationsSet.has(l)) : [];

    // Use latest story for display (has imageUrl), but if none use common story
    const displayStory = latestStory || commonStory;

    res.status(200).json({ person: { userInfo: person, commonInterests, commonStory: displayStory } });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Friend request: create a notification for the target user
app.post("/friend-request", authenticateToken, async (req, res) => {
  const { toUserId } = req.body;
  const { userId } = req.user;
  try {
    const fromUser = await User.findById(userId).select("fullName");
    if (!fromUser) return res.status(404).json({ error: true, message: "Sender not found" });
    const toUser = await User.findById(toUserId).select("fullName email");
    if (!toUser) return res.status(404).json({ error: true, message: "Target user not found" });

    const notification = new Notification({
      userId: toUserId,
      title: "Friend Request",
      message: `${fromUser.fullName} has sent you a friend request`,
      createdBy: userId,
      type: "friend_request",
      meta: { fromUserId: userId },
    });

    await notification.save();
    res.status(201).json({ message: "Friend request sent" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Respond to friend request (accept/reject)
app.post("/friend-request/respond", authenticateToken, async (req, res) => {
  const { notificationId, accept } = req.body;
  const { userId } = req.user;

  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ error: true, message: "Notification not found" });
    if (notification.userId.toString() !== userId.toString()) return res.status(403).json({ error: true, message: "Not allowed" });

    if (notification.type === "friend_request") {
      const fromUserId = notification.meta?.fromUserId;
      if (!fromUserId) return res.status(400).json({ error: true, message: "Invalid friend request" });

      if (accept) {
        await User.updateOne({ _id: userId }, { $addToSet: { friends: fromUserId } });
        await User.updateOne({ _id: fromUserId }, { $addToSet: { friends: userId } });
      }

      await notification.deleteOne({ _id: notificationId });
      return res.status(200).json({ message: accept ? "Friend request accepted" : "Friend request rejected" });
    }

    if (notification.type === "group_invite") {
      const groupId = notification.meta?.groupId;
      if (!groupId) return res.status(400).json({ error: true, message: "Invalid group invite" });

      if (accept) {
        // add user to group members
        await Group.updateOne({ _id: groupId }, { $addToSet: { members: userId } });
      }

      await notification.deleteOne({ _id: notificationId });
      return res.status(200).json({ message: accept ? "Joined group" : "Group invite rejected" });
    }

    // Unknown type: mark read
    notification.isRead = true;
    await notification.save();
    return res.status(200).json({ message: "Handled" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Get friends list for current user (include last travel story image)
app.get("/friends", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const me = await User.findById(userId).populate("friends", "fullName email");
    const friends = [];
    for (const f of (me.friends || [])) {
      const lastStory = await TravelStory.findOne({ userId: f._id }).sort({ visitedDate: -1 }).select("imageUrl visitedDate title");
      friends.push({ userInfo: f, lastStory });
    }
    res.status(200).json({ friends });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Get groups created by current user
app.get("/groups/created", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const groups = await Group.find({ createdBy: userId });
    res.status(200).json({ groups });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Invite a user to a group (creates notification for target user)
app.post("/groups/:id/invite", authenticateToken, async (req, res) => {
  const { id } = req.params; // group id
  const { toUserId } = req.body;
  const { userId } = req.user;

  try {
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: true, message: "Group not found" });

    const notification = new Notification({
      userId: toUserId,
      title: `Group invite: ${group.name}`,
      message: `${req.user.userId ? req.user.userId : userId} has invited you to join ${group.name}`,
      createdBy: userId,
      type: "group_invite",
      meta: { groupId: id, fromUserId: userId },
    });

    await notification.save();
    res.status(201).json({ message: "Invite sent" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Get group details (members + basic info)
app.get("/groups/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const group = await Group.findById(id).populate("members", "fullName email").populate("createdBy", "fullName email");
    if (!group) return res.status(404).json({ error: true, message: "Group not found" });
    res.status(200).json({ group });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Delete a group (only creator)
app.delete("/groups/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  try {
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: true, message: "Group not found" });
    if (group.createdBy.toString() !== userId.toString()) return res.status(403).json({ error: true, message: "Not allowed" });

    // remove announcements for group
    await Announcement.deleteMany({ groupId: id });
    // remove group
    await group.deleteOne({ _id: id });

    res.status(200).json({ message: "Group deleted" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Announcements: post and list
app.post("/groups/:id/announcements", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const { userId } = req.user;
  if (!message) return res.status(400).json({ error: true, message: "Message is required" });
  try {
    const announcement = new Announcement({ groupId: id, userId, message });
    await announcement.save();
    res.status(201).json({ announcement });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

app.get("/groups/:id/announcements", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const announcements = await Announcement.find({ groupId: id }).sort({ createdOn: -1 }).populate("userId", "fullName email");
    res.status(200).json({ announcements });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Remove a member from group (creator only)
app.post("/groups/:id/remove-member", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { memberId } = req.body;
  const { userId } = req.user;

  try {
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: true, message: "Group not found" });
    if (group.createdBy.toString() !== userId.toString()) return res.status(403).json({ error: true, message: "Only creator can remove members" });

    // Remove member from group
    await Group.updateOne({ _id: id }, { $pull: { members: memberId } });
    res.status(200).json({ message: "Member removed" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Leave a group (any member)
app.post("/groups/:id/leave", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: true, message: "Group not found" });

    // Remove user from members
    await Group.updateOne({ _id: id }, { $pull: { members: userId } });
    res.status(200).json({ message: "Left group" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Update group background image (creator only)
app.post("/groups/:id/background", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { backgroundImageUrl } = req.body;
  const { userId } = req.user;

  try {
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: true, message: "Group not found" });
    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: true, message: "Only creator can set background" });
    }

    // Update background image
    await Group.updateOne({ _id: id }, { backgroundImageUrl });
    res.status(200).json({ message: "Background updated", backgroundImageUrl });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

module.exports = app;
