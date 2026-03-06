import twilio from "twilio";

export async function sendInviteSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    throw new Error("Missing Twilio configuration");
  }
  const client = twilio(sid, token);
  return client.messages.create({ to, from, body });
}
