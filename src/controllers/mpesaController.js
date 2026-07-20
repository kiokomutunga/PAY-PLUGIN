import {getMpesaAccessToken } from "../services/mpesaService";

export async function testmpesaConnection (response, request) {

    try {
        const accessToken = await getMpesaAccessToken ();
        return response.status(200).json ({
            sucess: true,
            message: "mpesa connection sucesful",
            tokenReceived: Boolean(accessToken),
        });


    }
    catch(error){
        return response.status().json({

            success: false,
            message: "Mpesa connection failed",
            error: error.message
        });

    }

}