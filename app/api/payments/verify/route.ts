import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";
import { hasStripeKey, retrieveCheckoutSession } from "@/lib/stripe";
import { sendEmailAsync, paymentReceiptEmail } from "@/lib/email";

// Called when Stripe redirects the user back to /billing?session_id=…
// Confirms the session was paid and flips the matching payment to "completed".
export async function GET(request: Request) {
  try {
    const me = await requireUser();
    const sessionId = new URL(request.url).searchParams.get("session_id");
    if (!sessionId) throw new HttpError(400, "session_id is required.");
    if (!hasStripeKey()) throw new HttpError(400, "Stripe is not configured.");

    const payment = await prisma.payment.findFirst({
      where: { txnId: sessionId, userId: me.id },
    });
    if (!payment) throw new HttpError(404, "Payment not found.");

    if (payment.status === "completed") {
      return Response.json({ status: "completed" });
    }

    const session = await retrieveCheckoutSession(sessionId);
    if (session.paymentStatus === "paid") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "completed" },
      });
      sendEmailAsync({
        to: me.email,
        ...paymentReceiptEmail({
          name: me.name,
          description: payment.description,
          amount: payment.amount,
          currency: payment.currency,
        }),
      });
      return Response.json({ status: "completed" });
    }

    return Response.json({ status: "pending" });
  } catch (err) {
    return errorResponse(err);
  }
}
