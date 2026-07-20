import express from "express";

import { testmpesaConnection } from "../controllers/mpesaController.js";

const router = express.Router();

router.get("/test-connection", testMpesaConnection);

export default router