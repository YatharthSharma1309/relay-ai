import { randomBytes } from "crypto";
import { db } from "@/lib/db";

const DEMO_ORG_SLUG = process.env.DEMO_ORGANIZATION_SLUG ?? "demo-company";
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL ?? "admin@demo.com";

function hasAuthBypassEnv() {
  return (
    process.env.AUTH_BYPASS === "true" ||
    process.env.NEXT_PUBLIC_AUTH_BYPASS === "true"
  );
}

export function isE2eAuthBypass() {
  return process.env.E2E_AUTH_BYPASS === "true" && hasAuthBypassEnv();
}

export function isAuthBypassEnabled() {
  if (isE2eAuthBypass()) return true;

  return hasAuthBypassEnv() && process.env.NODE_ENV !== "production";
}

export function assertAuthBypassNotInProduction() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (isE2eAuthBypass()) return;
  if (process.env.CI === "true" && hasAuthBypassEnv()) return;
  if (process.env.NODE_ENV !== "production") return;

  if (hasAuthBypassEnv()) {
    throw new Error("AUTH_BYPASS cannot be enabled in production.");
  }
}

export function generateWidgetPublicKey() {
  return `wk_live_${randomBytes(24).toString("hex")}`;
}

export function slugifyOrgName(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return base || `org-${randomBytes(4).toString("hex")}`;
}

export async function ensureUniqueOrgSlug(base: string) {
  let slug = base;
  let attempt = 0;

  while (attempt < 10) {
    const existing = await db.organization.findUnique({ where: { slug } });
    if (!existing) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  return `${base}-${randomBytes(4).toString("hex")}`;
}

export async function getDemoOrganizationContext() {
  const configuredWidgetKey = process.env.DEMO_WIDGET_KEY?.trim();
  const organization = await db.organization.upsert({
    where: { slug: DEMO_ORG_SLUG },
    create: {
      name: "Demo Company",
      slug: DEMO_ORG_SLUG,
      widgetPublicKey: configuredWidgetKey || generateWidgetPublicKey(),
      widgetEnabled: true,
    },
    update: {},
  });

  if (
    configuredWidgetKey &&
    organization.widgetPublicKey !== configuredWidgetKey
  ) {
    await db.organization.update({
      where: { id: organization.id },
      data: {
        widgetPublicKey: configuredWidgetKey,
        widgetEnabled: true,
      },
    });
  } else if (!organization.widgetPublicKey) {
    await db.organization.update({
      where: { id: organization.id },
      data: { widgetPublicKey: generateWidgetPublicKey() },
    });
  }

  const user = await db.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    create: {
      email: DEMO_USER_EMAIL,
      name: "Demo Admin",
    },
    update: {},
  });

  await db.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: "ADMIN",
    },
    update: { role: "ADMIN" },
  });

  const refreshed = await db.organization.findUniqueOrThrow({
    where: { id: organization.id },
  });

  return { organization: refreshed, user };
}
