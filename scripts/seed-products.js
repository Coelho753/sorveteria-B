const seed = require('./seed-products.json');

const API_URL = process.env.API_URL || 'https://sorveteria-b.onrender.com';
const TOKEN = process.env.ADMIN_TOKEN;
const DRY_RUN = process.env.DRY_RUN === '1';

if (!TOKEN && !DRY_RUN) {
  console.error('ADMIN_TOKEN não definido. Use DRY_RUN=1 para simular sem enviar ao backend.');
  process.exit(1);
}

const run = async () => {
  let ok = 0;
  let fail = 0;

  for (const product of seed) {
    if (DRY_RUN) {
      console.log(`DRY → ${product.category} / ${product.name}`);
      ok += 1;
      continue;
    }

    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      console.error(`Falha: ${product.name} — HTTP ${response.status} — ${await response.text()}`);
      fail += 1;
    } else {
      console.log(`OK: ${product.name}`);
      ok += 1;
    }
  }

  console.log(`Concluído: ${ok} ok, ${fail} falhas.`);
  if (fail > 0) process.exit(1);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
