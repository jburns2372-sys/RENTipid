import { PrismaClient } from "@prisma/client";
import { authOptions } from "./src/lib/auth";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function run() {
  const credentialsProvider = authOptions.providers.find(p => p.id === "credentials") as any;
  
  const badUser = await prisma.user.create({
    data: {
      email: "bad.synthetic@example.com",
      full_name: "Bad",
      account_type: "Individual",
      role: "Renter",
      status: "Blacklisted",
      password_hash: bcrypt.hashSync("password123", 10)
    }
  });

  try {
    let res = null;
    if (typeof credentialsProvider.options?.authorize === "function") {
      res = await credentialsProvider.options.authorize({ email: badUser.email, password: "password123" }, {});
    } else {
      res = await credentialsProvider.authorize({ email: badUser.email, password: "password123" }, {});
    }
    console.log("RES:", res);
  } catch (e: any) {
    console.log("ERR:", e.message);
  }
  
  await prisma.user.delete({ where: { id: badUser.id } });
}

run().catch(console.error).finally(() => prisma.$disconnect());
