import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const test = async () => {
  try {
    console.log("Testing SMTP connection...");

    await transporter.verify();

    console.log("SMTP is WORKING ✅");

    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER,
      subject: "SMTP TEST",
      text: "If you receive this, SMTP is working",
    });

    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("SMTP FAILED ❌");
    console.error(err);
  }
};

test();