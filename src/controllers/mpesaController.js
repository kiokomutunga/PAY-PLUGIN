import {getMpesaAccessToken } from "../services/mpesaService.js";

export async function testMpesaConnection (request, response) {

    try {
        const accessToken = await getMpesaAccessToken ();
        return response.status(200).json ({
            success: true,
            message: "mpesa connection succesful",
            tokenReceived: Boolean(accessToken),
        });


    }
    catch(error){
        return response.status(500).json({

            success: false,
            message: "Mpesa connection failed",
            error: error.message
        });

    }

}