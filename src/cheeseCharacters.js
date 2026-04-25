export const CHEESE_CHARACTERS = {
  blue: {
    file: '/Blue.png',
    keywords: ['blue', 'roquefort', 'gorgonzola', 'stilton', 'fourme', 'cambozola', 'bleu'],
  },
  brie: {
    file: '/Brie.png',
    keywords: ['brie', 'camembert', 'coulommiers', 'chaource', 'bloomy', 'soft-ripened'],
  },
  cheddar: {
    file: '/Cheddar.png',
    keywords: ['cheddar', 'colby', 'monterey', 'lancashire', 'cheshire', 'sharp', 'aged cheddar'],
  },
  gouda: {
    file: '/Gouda.png',
    keywords: ['gouda', 'edam', 'havarti', 'leerdammer', 'beemster', 'maasdam', 'dutch'],
  },
  mozzarella: {
    file: '/Mozzarella.png',
    keywords: ['mozzarella', 'burrata', 'stracciatella', 'provolone', 'scamorza', 'fresh', 'pulled'],
  },
  swiss: {
    file: '/Swiss.png',
    keywords: [
      'swiss',
      'emmental',
      'gruyere',
      'gruyère',
      'jarlsberg',
      'raclette',
      'appenzeller',
      'comté',
      'comte',
      'alpine',
      'beaufort',
    ],
  },
}

export const getCheeseCharacter = (cheeseName) => {
  const lower = (cheeseName || '').toLowerCase()
  const match = Object.values(CHEESE_CHARACTERS).find(({ keywords }) =>
    keywords.some((kw) => lower.includes(kw)),
  )
  return match?.file || '/Cheddar.png'
}
