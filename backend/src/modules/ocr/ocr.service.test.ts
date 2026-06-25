import assert from 'assert';
import { parseText } from './ocr.service';

// Test case 1: Standard input with spaces
{
  const input = 'Veg Fried Rice 100\nNoodles 120';
  const result = parseText(input);
  const actual = result.items.map((item) => ({ name: item.name, price: item.price }));
  assert.deepStrictEqual(actual, [
    { name: 'Veg Fried Rice', price: 100 },
    { name: 'Noodles', price: 120 },
  ]);
  assert(!result.errors || result.errors.length === 0);
}

// Test case 2: Mojito and Milkshake
{
  const input = 'Mojito 70\nMilkshake 80';
  const result = parseText(input);
  const actual = result.items.map((item) => ({ name: item.name, price: item.price }));
  assert.deepStrictEqual(actual, [
    { name: 'Mojito', price: 70 },
    { name: 'Milkshake', price: 80 },
  ]);
  assert(!result.errors || result.errors.length === 0);
}

// Test case 3: Chicken Biryani
{
  const input = 'Chicken Biryani 250';
  const result = parseText(input);
  const actual = result.items.map((item) => ({ name: item.name, price: item.price }));
  assert.deepStrictEqual(actual, [
    { name: 'Chicken Biryani', price: 250 },
  ]);
  assert(!result.errors || result.errors.length === 0);
}

// Test case 4: Various separators and currencies
{
  const inputs = [
    'Veg Fried Rice 100',
    'Veg Fried Rice - 100',
    'Veg Fried Rice : 100',
    'Veg Fried Rice ₹100',
    'Veg Fried Rice Rs 100',
    'Veg Fried Rice .... 100',
    'Veg Fried Rice .............100'
  ];
  for (const line of inputs) {
    const result = parseText(line);
    assert.strictEqual(result.items.length, 1, `Failed to parse: ${line}`);
    assert.strictEqual(result.items[0].name, 'Veg Fried Rice', `Name mismatch for: ${line}`);
    assert.strictEqual(result.items[0].price, 100, `Price mismatch for: ${line}`);
  }
}

// Test case 5: Partial success mode (some lines invalid, some valid)
{
  const input = 'Menu Header\nVeg Fried Rice 100\nWelcome to our restaurant\nNoodles 120\nSome footer info';
  const result = parseText(input);
  const actual = result.items.map((item) => ({ name: item.name, price: item.price }));
  assert.deepStrictEqual(actual, [
    { name: 'Veg Fried Rice', price: 100 },
    { name: 'Noodles', price: 120 },
  ]);
  assert(!result.errors || result.errors.length === 0);
}

// Test case 6: Validation input from user request
{
  const input = 'BIRIYANI - 50\nCURD RICE - 30\nGRILL - 320';
  const result = parseText(input);
  const actual = result.items.map((item) => ({ name: item.name, price: item.price }));
  assert.deepStrictEqual(actual, [
    { name: 'Biryani', price: 50 },
    { name: 'Curd Rice', price: 30 },
    { name: 'Grill', price: 320 },
  ]);
  assert(!result.errors || result.errors.length === 0);
}

console.log('OCR parser regression test passed');

