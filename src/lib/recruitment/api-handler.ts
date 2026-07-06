import { NextResponse } from "next/server";
import { withOrgMembership, type OrgMembershipContext } from "@/lib/auth";
import { RecruitmentError } from "@/lib/recruitment/errors";

export function recruitmentErrorResponse(error: unknown) {
  if (error instanceof RecruitmentError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }
  return null;
}

export async function withRecruitmentOrg<T>(
  handler: (context: OrgMembershipContext) => Promise<T>,
) {
  return withOrgMembership(async (context) => {
    try {
      return await handler(context);
    } catch (error) {
      const mapped = recruitmentErrorResponse(error);
      if (mapped) return mapped;
      throw error;
    }
  });
}
