import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

function getClient() {
  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }
  return twilio(accountSid, authToken);
}

/**
 * Send an SMS notification to the customer.
 * Returns true if sent, false if Twilio is not configured (silent no-op).
 * Throws on actual send failures.
 */
export async function sendSms(to: string, body: string): Promise<boolean> {
  const client = getClient();
  if (!client) {
    console.warn("Twilio not configured — skipping SMS");
    return false;
  }

  // Normalize to E.164 format for US numbers
  const digits = to.replace(/\D/g, "");
  const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`;

  await client.messages.create({
    body,
    from: fromNumber,
    to: e164,
  });

  return true;
}
