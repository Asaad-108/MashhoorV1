import dotenv from "dotenv";
dotenv.config();
import { sendEmail } from "./services/emailService";

async function test() {
  try {
    await sendEmail("muhammadasad1859@gmail.com", "Test Email", "This is a test email");
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Email failed:", err);
  }
}
test();
