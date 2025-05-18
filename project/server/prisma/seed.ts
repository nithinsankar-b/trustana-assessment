// prisma/seed.ts
import { PrismaClient, AttributeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  // Clean up existing data in correct order to avoid foreign key issues
  await prisma.attribute.deleteMany();
  await prisma.product.deleteMany();
  // Seed attributes (enrichment fields)
  const attributesData = [
    {
      name: 'Item Weight',
      type: AttributeType.MEASURE,
      unit: 'G',
      options: [],
      isRequired: true,
      systemGenerated: true,
    },
    {
      name: 'Ingredients',
      type: AttributeType.LONG_TEXT,
      options: [],
      isRequired: true,
      systemGenerated: true,
    },
    {
      name: 'Product Description',
      type: AttributeType.RICH_TEXT,
      options: [],
      isRequired: true,
      systemGenerated: true,
    },
    {
      name: 'Storage Requirements',
      type: AttributeType.SINGLE_SELECT,
      options: ['Dry Storage', 'Deep Frozen', 'Ambient Storage', 'Frozen Food Storage'],
      isRequired: true,
      systemGenerated: true,
    },
    {
      name: 'Items per Package',
      type: AttributeType.NUMBER,
      options: [],
      isRequired: true,
      systemGenerated: true,
    },
    {
      name: 'Color',
      type: AttributeType.SHORT_TEXT,
      options: [],
      isRequired: true,
      systemGenerated: true,
    },
    {
      name: 'Material',
      type: AttributeType.SHORT_TEXT,
      options: [],
      isRequired: true,
      systemGenerated: true,
    },
    {
      name: 'Width',
      type: AttributeType.MEASURE,
      unit: 'CM',
      options: [],
      isRequired: true,
      systemGenerated: true,
    },
    {
      name: 'Height',
      type: AttributeType.MEASURE,
      unit: 'CM',
      options: [],
      isRequired: true,
      systemGenerated: true,
    },
    {
      name: 'Warranty',
      type: AttributeType.NUMBER,
      options: [],
      isRequired: true,
      systemGenerated: true,
    },
  ];  

  for (const attr of attributesData) {
    await prisma.attribute.upsert({
      where: { name: attr.name },
      update: {},
      create: attr,
    });
  }

  // Seed products
  await prisma.product.createMany({
    data: [
      {
        name: 'Instant rice fettuccine',
        brand: 'Koka',
        barcode: null,
        images: [
          'https://kokanoodles.com/wp-content/uploads/2024/09/KRL4_Beef-Pho-Silk-Bowl_Slanted-2024.09.03.webp',
          'https://kokanoodles.com/wp-content/uploads/2024/09/KRL4_Beef-Pho-Silk-Bowl_Right-2024.09.03.webp',
        ],
      },
      {
        name: 'Black Neck Cord with Buckle',
        brand: 'Univet',
        barcode: null,
        images: [
          'https://www.alive-sr.co.uk/cdn/shop/products/Univetcords023346.jpg?v=1641471019&width=1200',
        ],
      },
      {
        name: 'Graphene Waterproof Sleep Protectors',
        brand: 'Equilibrium Tencel',
        barcode: '9336473031366',
        images: [],
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
