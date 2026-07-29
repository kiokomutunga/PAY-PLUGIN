import {getMpesaAccessToken } from "../services/mpesaService.js";
import { initiateStkPush } from "../services/mpesaService.js";

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

export async function initiateMpesaPayment (req,res){
    try{
        const{phoneNumber, amount, accountReference, transactionDescription} = req.body;
        if (!phoneNumber){
            return res.status(400).json({
                success: false,
                message: "Phone Number is required"
            });
        }

        if (amount === undefined || amount === null){
            return res.status(400).json({
                success: false ,
                message: "Amount is required"
            })
        }

        const numericAmount = Number(amount);

        if (Number.isNaN (numericAmount) || numericAmount <= 0){
            return res.status(400).json({
                sucess : false,
                mesage: "Amount must be greator than zero"
            });
        }

        const result = await initiateStkPush ({
            phoneNumber,
            amount: numericAmount,
            accountReference,
            transactionDescription,
        });

        return res.status(201).json({
            success: true,
            message: "STK push initiated succesfully",
            data: result,
        });

    } 
    catch(error){
        console.error( "STK Push controller ", error);

        const statusCode = error.statusCode || error.status || 500;

        return res.status (statusCode).json ({
            success : false,
            message: error.message || " Failed to initiate STK Push"
        });

    }
}
