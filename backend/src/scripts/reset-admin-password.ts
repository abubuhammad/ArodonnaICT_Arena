import "dotenv/config";
import readline from "readline";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2]?.trim().toLowerCase() || "admin@example.com";

function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const input = process.stdin;
    const output = process.stdout;
    let value = "";

    output.write(prompt);
    input.setRawMode?.(true);
    input.resume();
    input.setEncoding("utf8");

    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          input.setRawMode?.(false);
          input.pause();
          process.exit(130);
        }
        if (character === "\r" || character === "\n") {
          input.setRawMode?.(false);
          input.pause();
          input.removeListener("data", onData);
          output.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u007f") {
          value = value.slice(0, -1);
          output.clearLine?.(0);
          output.cursorTo?.(0);
          output.write(`${prompt}${"*".repeat(value.length)}`);
        } else {
          value += character;
          output.write("*");
        }
      }
    };

    input.on("data", onData);
  });
}

async function main() {
  const password = await readHidden(`New password for ${email}: `);
  if (!password) throw new Error("Password cannot be empty");

  const admin = await prisma.user.findFirst({ where: { email, role: "ADMIN" } });
  if (!admin) throw new Error(`No ADMIN account found for ${email}`);

  await prisma.user.update({
    where: { id: admin.id },
    data: { password: await bcrypt.hash(password, 10) }
  });

  console.log(`Password reset for ${email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());