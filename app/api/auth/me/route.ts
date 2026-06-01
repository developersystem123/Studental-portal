import { getCurrentUserWithPlan } from "@/lib/auth-server";

export async function GET() {
  const user = await getCurrentUserWithPlan();
  return Response.json({ user });
}
