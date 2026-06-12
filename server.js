const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

// Agar environment variables local file se load karne ho (.env file create karke)
// require('dotenv').config(); 

const app = express();

app.use(cors());
app.use(express.json());

// In-memory OTP storage
const otpStore = {};

/* Gmail Transport Configuration */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* Home Route */
app.get("/", (req, res) => {
  res.send("OTP Server is Running Perfectly!");
});

/* Send OTP Endpoint */
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email required"
    });
  }

  // 6-Digit Random OTP Generation
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email.toLowerCase().trim()] = otp; // Lowercase tracking to avoid mismatch

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Login OTP - CloudDrive",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 450px;">
          <h2 style="color: #4f46e5;">CloudDrive Login OTP</h2>
          <p>Your Verification Code is:</p>
          <h1 style="background: #f1f5f9; padding: 10px; text-align: center; letter-spacing: 5px; color: #1e293b; border-radius: 8px;">${otp}</h1>
          <p style="color: #64748b; font-size: 13px;">Do not share this OTP with anyone. Valid for this session only.</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: "OTP Sent successfully"
    });

  } catch (error) {
    console.error("Nodemailer Error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Check server credentials."
    });
  }
});

/* Verify OTP Endpoint */
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP required"
    });
  }

  const formattedEmail = email.toLowerCase().trim();

  if (otpStore[formattedEmail] && otpStore[formattedEmail] === otp.trim()) {
    delete otpStore[formattedEmail]; // Delete OTP after successful verification

    return res.json({
      success: true,
      message: "OTP Verified"
    });
  }

  res.status(400).json({
    success: false,
    message: "Invalid or expired OTP"
  });
});

/* Start Server */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
