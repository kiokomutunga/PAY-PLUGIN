import express from "express";

const app = express();
const port = 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to my M-Pesa backend"
  });
});

app.post("/api/payments", (req, res) => {
    
  const { phoneNumber, amount } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required"
    });
  }

  if (!amount) {
    return res.status(400).json({
      success: false,
      message: "Amount is required"
    });
  }

  res.json({
    success: true,
    message: "Payment information is valid",
    phoneNumber,
    amount
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});