function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

async function ensureUniqueSlug(base, existsFn) {
  const root = slugify(base) || 'shop';
  let candidate = root;
  let n = 1;
  while (await existsFn(candidate)) {
    n += 1;
    candidate = `${root}-${n}`.slice(0, 140);
  }
  return candidate;
}

module.exports = { slugify, ensureUniqueSlug };
