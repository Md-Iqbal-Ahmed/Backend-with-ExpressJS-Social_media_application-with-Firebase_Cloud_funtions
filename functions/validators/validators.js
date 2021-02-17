const { user } = require("firebase-functions/lib/providers/auth");

const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (email.match(regEx)) return true;
  else return false;
};

exports.validateSignupData = (data) => {
  let error = {};

  if (isEmpty(data.email)) {
    error.email = "Must not be empty";
  } else if (!isEmail(data.email)) {
    error.email = "Email is not valid";
  }

  if (isEmpty(data.password) || isEmpty(data.confirmPassword)) {
    error.password = "Must not be empty";
    error.confirmPassword = "Must not be empty";
  }

  if (data.password !== data.confirmPassword) {
    error.confirmPassword = "password must be same";
  }

  if (isEmpty(data.handle)) {
    error.handle = "Must not be empty";
  }

  return {
    error,
    valid: Object.keys(error).length === 0 ? true : false,
  };
};

exports.validateLoginData = (data) => {
  let error = {};

  if (isEmpty(data.email)) {
    error.email = "Must not be empty";
  }

  if (isEmpty(data.password)) {
    error.password = "Must not be empty";
  }

  return {
    error,
    valid: Object.keys(error).length === 0 ? true : false,
  };
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (!isEmpty(data.bio.trim())) {
    userDetails.bio = data.bio;
  }
  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `http://${data.website.trim()}`;
    } else {
      userDetails.website = data.website;
    }
  }
  if (!isEmpty(data.location.trim())) {
    userDetails.location = data.location;
  }

  return userDetails;
};
