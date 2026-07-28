import express from "express";
import {
    handleMpesaCallback,
} from "../controllers/mpesaCallbackController.js";

const router = express.Router();

router.post("/callback", handleMpesaCallback);

export default router;