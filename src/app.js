import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());

app.use(
    cors(
        {
            origin: process.env.Url,
        }
    )
) //only allow requests from this frontend

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Payment API is running",
    environment: process.env.NODE_ENV,
  });
});

app.get ("/", (response,request)=>{
    response.json(
        {
            success: true,
            message: "Pay App"
        }
    )
})

export default app;