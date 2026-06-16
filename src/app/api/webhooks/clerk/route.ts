import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ensureUniqueOrgSlug,
  generateWidgetPublicKey,
  slugifyOrgName,
} from "@/lib/auth/demo";

function mapClerkRole(role: string | undefined) {
  if (role === "org:admin" || role === "admin") return "ADMIN" as const;
  return "AGENT" as const;
}

function getPrimaryEmail(data: {
  email_addresses?: Array<{ id: string; email_address: string }>;
  primary_email_address_id?: string | null;
}) {
  const primary = data.email_addresses?.find(
    (entry) => entry.id === data.primary_email_address_id,
  )?.email_address;
  return primary ?? data.email_addresses?.[0]?.email_address ?? null;
}

async function upsertUserFromWebhook(data: {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string;
  email_addresses?: Array<{ id: string; email_address: string }>;
  primary_email_address_id?: string | null;
}) {
  const email =
    getPrimaryEmail(data) ?? `${data.id}@users.clerk.placeholder`;

  if (!getPrimaryEmail(data)) {
    console.warn(
      `Clerk user webhook missing email for ${data.id}; using placeholder.`,
    );
  }

  return db.user.upsert({
    where: { clerkUserId: data.id },
    create: {
      clerkUserId: data.id,
      email,
      name:
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        email.split("@")[0],
      imageUrl: data.image_url,
    },
    update: {
      email,
      name:
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        email.split("@")[0],
      imageUrl: data.image_url,
    },
  });
}

async function upsertOrganizationFromWebhook(data: { id: string; name: string }) {
  const baseSlug = slugifyOrgName(data.name);
  const slug = await ensureUniqueOrgSlug(baseSlug);

  return db.organization.upsert({
    where: { clerkOrgId: data.id },
    create: {
      clerkOrgId: data.id,
      name: data.name,
      slug,
      widgetPublicKey: generateWidgetPublicKey(),
      widgetEnabled: true,
    },
    update: {
      name: data.name,
    },
  });
}

export async function POST(request: NextRequest) {
  let verified = false;

  try {
    const event = await verifyWebhook(request);
    verified = true;

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        await upsertUserFromWebhook(event.data);
        break;
      }

      case "user.deleted": {
        await db.user.deleteMany({ where: { clerkUserId: event.data.id } });
        break;
      }

      case "organization.created":
      case "organization.updated": {
        await upsertOrganizationFromWebhook(event.data);
        break;
      }

      case "organization.deleted": {
        await db.organization.deleteMany({
          where: { clerkOrgId: event.data.id },
        });
        break;
      }

      case "organizationMembership.created":
      case "organizationMembership.updated": {
        const organization = await upsertOrganizationFromWebhook(
          event.data.organization,
        );
        const clerkUserId = event.data.public_user_data.user_id;
        let user = await db.user.findUnique({ where: { clerkUserId } });

        if (!user) {
          const email =
            event.data.public_user_data.identifier ??
            `${clerkUserId}@users.clerk`;
          user = await db.user.create({
            data: {
              clerkUserId,
              email,
              name:
                [
                  event.data.public_user_data.first_name,
                  event.data.public_user_data.last_name,
                ]
                  .filter(Boolean)
                  .join(" ") || email.split("@")[0],
              imageUrl: event.data.public_user_data.image_url,
            },
          });
        }

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
            role: mapClerkRole(event.data.role),
          },
          update: {
            role: mapClerkRole(event.data.role),
          },
        });
        break;
      }

      case "organizationMembership.deleted": {
        const clerkOrgId = event.data.organization.id;
        const clerkUserId = event.data.public_user_data.user_id;

        const [organization, user] = await Promise.all([
          db.organization.findUnique({ where: { clerkOrgId } }),
          db.user.findUnique({ where: { clerkUserId } }),
        ]);

        if (!organization || !user) break;

        await db.organizationMember.deleteMany({
          where: {
            organizationId: organization.id,
            userId: user.id,
          },
        });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Clerk webhook error:", error);
    if (verified) {
      return NextResponse.json(
        { error: "Webhook handler failed" },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 },
    );
  }
}
