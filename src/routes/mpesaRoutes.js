import express from "express";

import {testMpesaConnection, initiateMpesaPayment, getmpesaTransactionstatus, getAllMpesaTransactions,} from "../controllers/mpesaController.js";

import { handleMpesaCallback,} from "../controllers/mpesaCallbackController.js";

const router = express.Router();
router.get("/transactions", getAllMpesaTransactions );
router.get("/test", testMpesaConnection);
router.post("/stkpush", initiateMpesaPayment);
router.post("/callback", handleMpesaCallback);
router.get("/transactions/:checkoutRequestId", getmpesaTransactionstatus)

export default router;