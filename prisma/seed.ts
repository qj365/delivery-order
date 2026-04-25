import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const driver = await prisma.deliveryDriver.upsert({
    where: { uid: "driver-test-uid" },
    update: {},
    create: {
      uid: "driver-test-uid",
      name: "Test Driver",
      phone: "+84-000-0000",
    },
  });

  const customer = await prisma.deliveryCustomer.create({
    data: {
      name: "Customer A",
      phone: "+84-111-1111",
      address: "123 Test Street",
    },
  });

  const run = await prisma.deliveryRun.create({
    data: {
      driverId: driver.id,
      status: "IN_PROGRESS",
    },
  });

  const orders = await Promise.all(
    Array.from({ length: 3 }, (_, i) =>
      prisma.deliveryOrder.create({
        data: {
          customerId: customer.id,
          status: "PENDING",
          items: {
            create: [
              {
                name: `Item ${i + 1}-A`,
                quantity: 1,
              },
              {
                name: `Item ${i + 1}-B`,
                quantity: 2,
              },
            ],
          },
        },
      }),
    ),
  );

  console.log("Seeded:", {
    driverId: driver.id,
    customerId: customer.id,
    runId: run.id,
    orderIds: orders.map((o) => o.id),
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
