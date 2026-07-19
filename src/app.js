import express from "express";
import cors from "cors";
import supabase from "./config/supabase.js";

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

app.get("/api/database-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("connection_tests")
      .select("*")
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Supabase connection failed",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supabase connection successful",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected database error",
      error: error.message,
    });
  }
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