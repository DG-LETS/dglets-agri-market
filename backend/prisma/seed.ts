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

  /* ── Section 20 & 37: Seed system settings (config-driven platform) ── */
  console.log('\n🔧 Seeding system settings...');
  const systemSettings = [
    { key: 'marketplace_commission_rate', value: '0.05',                                        description: 'Marketplace commission rate (5%). Deducted from seller proceeds.' },
    { key: 'payment_processing_fee_type', value: 'percentage_with_cap',                         description: 'Payment gateway fee model: percentage | fixed | percentage_with_cap' },
    { key: 'payment_processing_percentage', value: '0.015',                                     description: 'Payment gateway percentage (Paystack: 1.5%)' },
    { key: 'payment_processing_fixed_fee',  value: '100',                                       description: 'Paystack flat fee in NGN (for transactions > ₦2,500)' },
    { key: 'payment_processing_cap',        value: '2000',                                      description: 'Maximum payment processing fee in NGN (Paystack cap = ₦2,000)' },
    { key: 'logistics_margin_default',      value: '0.10',                                      description: 'DG-LETS default logistics coordination margin (10% of provider quote)' },
    { key: 'settlement_hold_days',          value: '3',                                         description: 'Auto-release seller proceeds N days after buyer confirmation' },
    { key: 'platform_positioning',          value: 'FREE TO JOIN. FREE TO LIST. PAY WHEN YOU SELL.', description: 'Core DG-LETS MVP adoption message (Section 34)' },
  ];
  for (const s of systemSettings) {
    await (prisma as any).systemSetting.upsert({
      where: { key: s.key }, create: s, update: { value: s.value, description: s.description },
    });
    console.log(`  ✅ ${s.key} = ${s.value}`);
  }

  console.log('\n🎉 DG-LETS seed complete!');
  console.log('   Commission: 5% seller-deducted | Registration: FREE');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
