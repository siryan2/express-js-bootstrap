'use strict';

const bcrypt = require('bcrypt'),
  sessionManager = require('./../services/sessionManager'),
  userService = require('../services/users'),
  errors = require('../errors');

exports.login = (req, res, next) => {

  const user = req.body ? {
    username: req.body.username,
    password: req.body.password
  } : {};

  userService.getByUsername(user.username, (err, u) => {
    if (err) {
      next(errors.databaseError(err.detail));
    } else if (u) {
      bcrypt.compare(user.password, u.password).then((isValid) => {
        if (isValid) {
          const auth = sessionManager.encode(u);

          res.status(200);
          res.set(sessionManager.HEADER_NAME, auth);
          res.send(u);
        } else {
          next(errors.invalidUser)
        }
      });
    } else {
      next(errors.invalidUser)
    }
  });
};

exports.update = (req, res, next) => {
  const update = req.body;
  const user = req.user;

  user.firstName = update.firstName || user.firstName;
  user.lastName = update.lastName || user.lastName;
  user.username = update.username || user.username;
  user.email = update.email || user.email;

  user.save((err, u) => {
    if (err) {
      next(errors.savingError(err));
    } else {
      const auth = sessionManager.encode(u);

      res.status(200);
      res.set(sessionManager.HEADER_NAME, auth);
      res.send(u);
    }
  });
};

exports.logout = (req, res, next) => {
  res.status(200);
  res.end();
};

exports.loggedUser = (req, res, next) => {
  res.status(200);
  res.send(req.user);
};

exports.create = (req, res, next) => {
  const saltRounds = 10;

  const user = req.body ? {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    password: req.body.password,
    email: req.body.email
  } : {};

  bcrypt.hash(user.password, saltRounds).then((hash) => {
    user.password = hash;

    userService.create(user, (err, u) => {

      if (err) {
        next(errors.savingError(err));
      } else {
        res.status(200);
        res.end();
      }
    });
  }).catch((err) => {
    next(errors.invalidUser)
  });
};
