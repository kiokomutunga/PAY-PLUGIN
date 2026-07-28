import supabase from "../config/supabase.js";

export async function handleMpesaCallback (req,res){
    try{
        console.log(
            "mpesa callback received: ", JSON.stringify(req.body, null, 2)
        );

        const callback = req.body?.Body?.stkCallback;

        if (!callback) {
            return res.status(400).json({
                success: false,
                message: "Invalid Mpesa call back payload"
            });
        }

        const {MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata, } = callback;

        if (!CheckoutRequestID) {
            return res.status(400).json({
                success: false,
                message: "CheckoutRequestID is missing"
            });
        }




    }
    catch(error){
        console.log("cannot feth ttransaction")
    }

}