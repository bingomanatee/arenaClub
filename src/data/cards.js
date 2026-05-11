import marketplaceData from './arenaMarketplaceBaseball.json'

const colors = ['#124e78', '#9a6b12', '#1f7a4d', '#0f766e', '#b45309', '#552583']

export const dataNotes = {
  summary: `${marketplaceData.count} baseball cards loaded from Arena Club marketplace pages ${marketplaceData.pagesCollected.join(', ')}.`,
  source: marketplaceData.source,
  collectedAt: marketplaceData.collectedAt,
}

export const arenaCards = marketplaceData.cards.map((card, index) => {
  const value = Number(card.price?.replace(/[$,]/g, '') ?? 0)
  const grade = Number(card.description.match(/overall grade of ([\d.]+)/)?.[1] ?? 0)
  const year = Number(card.set.match(/\b(19|20)\d{2}\b/)?.[0] ?? 0)
  const cardNumber = card.variant.match(/#([^·]+)/)?.[1]?.trim() ?? ''
  const serial = card.variant
    .split('·')
    .map((part) => part.trim())
    .find((part) => /^\d+\/\d+$/.test(part))

  return {
    id: card.id,
    player: card.name,
    year,
    set: card.set,
    parallel: card.variant.replace(/·?\s*#[^·]+/, '').trim() || 'Base',
    cardNumber,
    serial: serial ?? 'Listed',
    category: 'Baseball',
    tier: value >= 500 ? 'Grail' : value >= 150 ? 'Chase' : 'Core',
    grade,
    value,
    price: card.price,
    color: colors[index % colors.length],
    image: card.image,
    alt: card.alt,
    marketplaceUrl: card.url,
    sourcePage: card.page,
  }
})
