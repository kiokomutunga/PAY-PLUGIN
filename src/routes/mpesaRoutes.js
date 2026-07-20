import express from "express";

import { testMpesaConnection } from "../controllers/mpesaController.js";

const router = express.Router();

router.get("/test-connection", testMpesaConnection);

export default router