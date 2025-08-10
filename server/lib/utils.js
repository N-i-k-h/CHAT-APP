import jwt from "jsonwebtoken";
import { promisify } from 'util';

const signToken = promisify(jwt.sign);

export const generateToken = (userId) => {
  return signToken({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export const verifyToken = async (token) => {
  return await promisify(jwt.verify)(token, process.env.JWT_SECRET);
};