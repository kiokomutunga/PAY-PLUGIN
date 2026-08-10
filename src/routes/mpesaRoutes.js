import express from "express";

import {testMpesaConnection, initiateMpesaPayment, getmpesaTransactionstatus, getAllMpesaTransactions, reconcileMpesaPayment} from "../controllers/mpesaController.js";

import { handleMpesaCallback,} from "../controllers/mpesaCallbackController.js";

const router = express.Router();
router.get("/transactions", getAllMpesaTransactions );
router.get("/test", testMpesaConnection);
router.post("/stkpush", initiateMpesaPayment);
router.post("/callback", handleMpesaCallback);

router.post(
    "/transactions/:checkoutRequestId/reconcile",
    reconcileMpesaPayment
);

router.get(
    "/transactions/:checkoutRequestId",
    getmpesaTransactionstatus
);


export default router;