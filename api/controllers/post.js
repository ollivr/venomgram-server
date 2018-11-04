// Modules
const mongoose = require('mongoose');
const cloudinary = require('cloudinary');

// Models
const Post = require('../models/post');
const User = require('../models/user');

// View Feed
exports.feed = (req, res) => {
  User.findOne({ username: req.params.username })
    .then(user => Post.find({ username: { $in: user.following } }).sort({ created: -1 }))
    .then(post => res.json(post.slice(parseInt(req.params.from, 10), parseInt(req.params.to, 10))))
    .catch(err => res.status(500).json({ message: err }));
};

// View Explore
exports.explore = (req, res) => {
  User.findOne({ username: req.params.username })
    .then(user => Post.find({
      $and: [
        { username: { $nin: user.blocked } },
        { username: { $nin: user.following } },
        { username: { $ne: user.username } },
      ],
    }).sort({ created: -1 }))
    .then(post => res.json(post.slice(parseInt(req.params.from, 10), parseInt(req.params.to, 10))))
    .catch(err => res.status(500).json({ message: err }));
};

// View Profile
exports.profile = (req, res) => {
  Post.find({ username: req.params.username })
    .sort({ created: -1 })
    .then(post => res.json(post.slice(parseInt(req.params.from, 10), parseInt(req.params.to, 10))))
    .catch(err => res.status(500).json({ message: err }));
};

// Make Post
exports.upload = (req, res) => {
  cloudinary.v2.uploader.upload(req.file.path, { format: 'jpg' },
    (error, result) => {
      if (error) {
        return res.status(400).json(error);
      }
      const newPost = new Post({
        _id: new mongoose.Types.ObjectId(),
        username: req.tokenData.username,
        caption: req.body.caption,
        path: result.secure_url,
      });
      return newPost
        .save()
        .then(() => res.status(201).json('Picture posted.'))
        .catch(err => res.status(500).json(err));
    });
};

// Delete Post
exports.delete = (req, res) => {
  Post
    .findOne({ _id: req.body.id })
    .exec()
    .then((post) => {
      if (post.username === req.tokenData.username) {
        post.remove();
        return res.json({ message: 'Post deleted.' });
      }
      return res.status(403).json({ message: 'Delete post failed.' });
    })
    .catch(err => res.status(500).json({ message: 'Error', error: err }));
};// make this delete the image on cloudinary storage as well
// when posting an image, you can attach a tag thru cloudinary of the user's name

// Like Post
exports.like = (req, res) => {
  Post
    .findByIdAndUpdate(req.body.id, { $addToSet: { likedBy: req.tokenData.username } },
      { runValidators: true })
    .then(() => res.json({ message: 'Liked post.' }))
    .catch(err => res.status(500).json({ message: 'Error', error: err }));
};

// Unlike Post
exports.unlike = (req, res) => {
  Post
    .findByIdAndUpdate(req.body.id, { $pull: { likedBy: req.tokenData.username } },
      { runValidators: true })
    .then(() => res.json({ message: 'Unliked post.' }))
    .catch(err => res.status(500).json({ message: 'Error', error: err }));
};

// Report Post
exports.report = (req, res) => {
  Post
    .findByIdAndUpdate(req.body.id, { $addToSet: { reportedBy: req.tokenData.username } },
      { runValidators: true })
    .then(() => res.json({ message: 'Reported post.' }))
    .catch(err => res.status(500).json({ message: 'Error', error: err }));
};
