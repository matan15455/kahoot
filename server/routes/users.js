import express from 'express';
import User from '../models/User.js';
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

