import "dotenv/config";
import { seedDemoWorkspace } from "../src/lib/demo";
import { db } from "../src/lib/db";

async function main() {
  const result = await seedDemoWorkspace();
  console.log("Demo workspace seeded:", {
    knowledgeCreated: result.knowledgeCreated,
    workspaceCreated: result.workspaceCreated,
    documentId: result.document.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
