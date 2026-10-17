/**
 * Seeded Pseudo-Random Number Generator (Mulberry32)
 * Ensures 100% deterministic and reproducible seed output across runs.
 */
const SEED_NUM = parseInt(process.env.CAREERBRIDGE_SEED || '2026', 10);

let state = SEED_NUM;

function resetSeed(newSeed = SEED_NUM) {
  state = newSeed;
}

function mulberry32() {
  let t = (state += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function random() {
  return mulberry32();
}

function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  const val = random() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

function randomItem(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(random() * array.length)];
}

function randomItems(array, count) {
  if (!array || array.length === 0) return [];
  const shuffled = shuffle([...array]);
  return shuffled.slice(0, Math.min(count, array.length));
}

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function weightedPick(items, weights) {
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let r = random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    if (r < weights[i]) return items[i];
    r -= weights[i];
  }
  return items[0];
}

module.exports = {
  resetSeed,
  random,
  randomInt,
  randomFloat,
  randomItem,
  randomItems,
  shuffle,
  weightedPick,
};
