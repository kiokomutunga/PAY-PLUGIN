import supabase from "../config/supabase";

import { reconcileMpesaPayment } from "../controllers/mpesaController";

export async function reconcilePendingPayments() {

    try {
        const cutoffTime = new Date(

            Date.now() - 30 * 1000

        ).toISOString();

        const { data}
    }

    catch(error)
}