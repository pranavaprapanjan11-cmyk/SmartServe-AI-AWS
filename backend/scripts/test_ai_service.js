require('dotenv').config();
const { getSalesForecast, getInventoryForecast, getMenuInsights, getRecommendations, getHealthScore } = require('../dist/modules/ai/ai.service');

const ownerId = 'ccafb27a-fe26-4b64-b1bb-f7d0540a6196';
const role = 'RESTAURANT_OWNER';

async function main() {
  try {
    console.log('--- TESTING AI SALES FORECAST ---');
    const sales = await getSalesForecast(ownerId, role);
    console.log(sales);

    console.log('\n--- TESTING AI INVENTORY FORECAST ---');
    const inv = await getInventoryForecast(ownerId, role);
    console.log(inv);

    console.log('\n--- TESTING AI MENU INSIGHTS ---');
    const menu = await getMenuInsights(ownerId, role);
    console.log(menu);

    console.log('\n--- TESTING AI RECOMMENDATIONS ---');
    const recs = await getRecommendations(ownerId, role);
    console.log(recs);

    console.log('\n--- TESTING AI HEALTH SCORE ---');
    const health = await getHealthScore(ownerId, role);
    console.log(health);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
