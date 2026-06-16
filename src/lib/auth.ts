export {
  assertAuthBypassNotInProduction,
  generateWidgetPublicKey,
  getDemoOrganizationContext,
  isAuthBypassEnabled,
} from "@/lib/auth/demo";

export {
  authErrorResponse,
  getCurrentOrganization,
  getOrgMembershipContext,
  requireOrgMembership,
  requireOrgMembershipOrRedirect,
  type OrgMembershipContext,
  AuthError,
} from "@/lib/auth/session";

export {
  getWidgetKeyFromRequest,
  resolveWidgetOrganization,
  widgetAuthErrorResponse,
  WidgetAuthError,
} from "@/lib/auth/widget";

export {
  withAdminMembership,
  withOrgMembership,
} from "@/lib/auth/api";
