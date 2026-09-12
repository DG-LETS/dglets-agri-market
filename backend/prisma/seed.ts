import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DG-LETS database...');

  /* Seed categories */
  const categories = [
    { name: 'Ginger',     slug: 'ginger',     icon: '🫚', sortOrder: 1  },
    { name: 'Turmeric',   slug: 'turmeric',   icon: '🟡', sortOrder: 2  },
    { name: 'Maize',      slug: 'maize',      icon: '🌽', sortOrder: 3  },
    { name: 'Rice',       slug: 'rice',       icon: '🍚', sortOrder: 4  },
    { name: 'Cassava',    slug: 'cassava',    icon: '🥔', sortOrder: 5  },
    { name: 'Yam',        slug: 'yam',        icon: '🍠', sortOrder: 6  },
    { name: 'Beans',      slug: 'beans',      icon: '🫘', sortOrder: 7  },
    { name: 'Sesame',     slug: 'sesame',     icon: '🌿', sortOrder: 8  },
    { name: 'Hibiscus',   slug: 'hibiscus',   icon: '🌺', sortOrder: 9  },
    { name: 'Moringa',    slug: 'moringa',    icon: '🌱', sortOrder: 10 },
    { name: 'Chilli',     slug: 'chilli',     icon: '🌶️', sortOrder: 11 },
    { name: 'Spices',     slug: 'spices',     icon: '🫙', sortOrder: 12 },
    { name: 'Vegetables', slug: 'vegetables', icon: '🥬', sortOrder: 13 },
    { name: 'Fruits',     slug: 'fruits',     icon: '🍊', sortOrder: 14 },
    { name: 'Oil Seeds',  slug: 'oil-seeds',  icon: '🫒', sortOrder: 15 },
    { name: 'Livestock',  slug: 'livestock',  icon: '🐄', sortOrder: 16 },
    { name: 'Processed',  slug: 'processed',  icon: '📦', sortOrder: 17 },
    { name: 'Other',      slug: 'other',      icon: '➕', sortOrder: 18 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  console.log(`✅ Seeded ${categories.length} categories`);
  console.log('🎉 Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
