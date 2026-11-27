import test from 'node:test';
import assert from 'node:assert/strict';
import { pandaImage } from '../../tools/maqadi/fetch-panda.mjs';
import { tamimiImage } from '../../tools/maqadi/fetch-tamimi.mjs';
import { imageBase } from '../../tools/maqadi/build-data.mjs';

test('Panda pictures use the 600 px file, not the thumbnail', () => {
  assert.equal(pandaImage('https://images.todoorstep.com/product/185053343/Ar_small.jpg?t='), 'https://images.todoorstep.com/product/185053343/Ar.jpg');
  assert.equal(pandaImage('https://images.todoorstep.com/product/1/Ar_small.jpg?t=17'), 'https://images.todoorstep.com/product/1/Ar.jpg?t=17');
  assert.equal(pandaImage(''), null);
  assert.equal(pandaImage('https://elsewhere.example/x.jpg'), null);
});

test('Tamimi pictures: the variant first, then the product', () => {
  const own = 'https://ecommedia.tamimimarkets.com/ecom-prod/productimages/1EA_1.png';
  const product = 'https://ecommedia.tamimimarkets.com/ecom-prod/productimages/1KG_1.png';
  assert.equal(tamimiImage([own], [product]), own);
  assert.equal(tamimiImage(undefined, [product]), product);
  assert.equal(tamimiImage([], ['http://ecommedia.tamimimarkets.com/x.png']), null);
});

test('a shared start is written once', () => {
  assert.equal(imageBase(['https://a.example/p/1/Ar.jpg', 'https://a.example/p/22/Ar.jpg']), 'https://a.example/p/');
  assert.equal(imageBase(['https://a.example/p/1.png']), '');
  assert.equal(imageBase(['https://a.example/1.png', 'https://b.example/2.png']), '');
});

test('every emoji the app shows has its 3D picture', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const file = char => 'maqadi/emoji/' + Array.from(char).map(c => c.codePointAt(0).toString(16)).filter(cp => cp !== 'fe0f').join('-') + '.webp';
  const recipes = readFileSync('tools/maqadi/recipes.json', 'utf8');
  const app = readFileSync('maqadi/app.js', 'utf8');
  const used = new Set([...recipes.matchAll(/"emoji":\s*"([^"]+)"/g)].map(m => m[1])
    .concat([...app.matchAll(/'(\p{Extended_Pictographic}[^']{0,12})'|"(\p{Extended_Pictographic}[^"]{0,12})"/gu)].map(m => m[1] || m[2])));
  assert.ok(used.size > 20);
  const missing = [...used].filter(char => !existsSync(file(char)));
  assert.deepEqual(missing, []);
});
