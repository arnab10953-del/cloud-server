const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());

const otpStore = {};

/* Gmail Transport */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* Home Route */

app.get("/", (req, res) => {
  res.send("OTP Server Running");
});

/* Send OTP */

app.post("/send-otp", async (req, res) => {

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email required"
    });
  }

  const otp =
    Math.floor(100000 + Math.random() * 900000)
    .toString();

  otpStore[email] = otp;

  try {

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Login OTP",
      html: `
        <h2>Login OTP</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Do not share this OTP with anyone.</p>
      `
    });

    res.json({
      success: true,
      message: "OTP Sent"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed To Send OTP"
    });

  }

});

/* Verify OTP */

app.post("/verify-otp", (req, res) => {

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP required"
    });
  }

  if (otpStore[email] === otp) {

    delete otpStore[email];

    return res.json({
      success: true,
      message: "OTP Verified"
    });

  }

  res.json({
    success: false,
    message: "Invalid OTP"
  });

});

/* Start Server */

const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});