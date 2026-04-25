import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import CheeseWheel from './CheeseWheel'
import CharacterTraitDiagram from './CharacterTraitDiagram'
import CheeseRunner from './CheeseRunner'

const SECTION_MATCHERS = {
  personality: ['personality analysis', 'analysis'],
  traits: ['cheese traits', 'traits'],
  ripeness: ['ripeness level', 'ripeness'],
}

const cleanLine = (line) => line.replace(/^#{1,6}\s*/, '').trim()

const matchSectionKey = (line) => {
  const normalized = cleanLine(line).toLowerCase().replace(/[:\-]/g, '').trim()
  return (
    Object.entries(SECTION_MATCHERS).find(([, variants]) =>
      variants.some((variant) => normalized.includes(variant)),
    )?.[0] ?? null
  )
}

const splitGeminiSections = (rawText) => {
  const lines = rawText.split('\n')
  const sections = {
    personality: [],
    traits: [],
    ripeness: [],
  }

  let currentSection = null
  let preface = []

  lines.forEach((line) => {
    const section = matchSectionKey(line)
    if (section) {
      currentSection = section
      return
    }

    if (currentSection) {
      sections[currentSection].push(line)
    } else {
      preface.push(line)
    }
  })

  const filledSections = Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [key, value.join('\n').trim()]),
  )

  const hasStructuredSections = Object.values(filledSections).some(Boolean)
  const prefaceLines = preface.map(cleanLine).filter(Boolean)
  const openerPhrase =
    prefaceLines[0]?.replace(/^[-*#\d.\s]*/u, '').replace(/\*\*/g, '').replace(/\*/g, '').trim() ||
    'A classic case.'
  const cheeseNameLine = prefaceLines[1] || prefaceLines[0] || resultFallbackName(rawText)
  const cheeseName = cheeseNameLine
    .replace(/^[-*#\d.\s]*/u, '')
    .replace(/^you are(\.\.\.)?\s*[:\-]?\s*/i, '')
    .replace(/^cheese\s*[:\-]?\s*/i, '')
    .trim()
  const sanitizedCheeseName = cheeseName
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/, '')
    .replace(/_{2}/g, '')
    .trim()
  const prefacePersonality = prefaceLines.slice(2).join('\n').trim()

  return {
    ...filledSections,
    personality: filledSections.personality || prefacePersonality,
    hasStructuredSections,
    openerPhrase,
    cheeseName: sanitizedCheeseName,
  }
}

const resultFallbackName = (rawText) => {
  const firstLine = rawText
    .split('\n')
    .map(cleanLine)
    .find(Boolean)
  return firstLine ? firstLine.replace(/^you are(\.\.\.)?\s*[:\-]?\s*/i, '').trim() : 'Mystery Cheese'
}

const traitLines = (traitsMarkdown) =>
  traitsMarkdown
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)

const mdComponents = {
  p: ({ children }) => <p style={{ margin: 0, lineHeight: '1.7' }}>{children}</p>,
  strong: ({ children }) => <strong style={{ fontWeight: 600, color: 'inherit' }}>{children}</strong>,
  ul: ({ children }) => <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>{children}</ul>,
  li: ({ children }) => <li style={{ marginBottom: '0.2rem' }}>{children}</li>,
  h1: ({ children }) => <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>{children}</p>,
  h2: ({ children }) => <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>{children}</p>,
  h3: ({ children }) => <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>{children}</p>,
}

const stripMarkdown = (text) =>
  (text || '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/gm, '')

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  for (let i = 0; i < words.length; i += 1) {
    const testLine = line + words[i] + ' '
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY)
      line = words[i] + ' '
      currentY += lineHeight
      if (currentY > y + lineHeight * 4) break
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, currentY)
}

function ResultCard({ result, onReset }) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [isPeeling, setIsPeeling] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const parsed = splitGeminiSections(result.rawText)
  const displayedCheeseName = parsed.cheeseName || result.cheeseName
  const displayedOpenerPhrase = result.openerPhrase || parsed.openerPhrase || 'A classic case.'

  useEffect(() => {
    setIsRevealed(false)
    setIsPeeling(false)
  }, [result.rawText])

  const handleReveal = () => {
    if (isRevealed || isPeeling) return
    setIsPeeling(true)
    window.setTimeout(() => setIsRevealed(true), 400)
  }

  const sections = [
    { label: 'Personality Analysis', key: 'personality' },
    { label: 'Cheese Traits', key: 'traits' },
    { label: 'Ripeness Level', key: 'ripeness' },
  ]

  const handleShare = async () => {
    setIsGenerating(true)
    try {
      const canvas = document.createElement('canvas')
      const dpr = 2
      canvas.width = 480 * dpr
      canvas.height = 600 * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context unavailable')
      ctx.scale(dpr, dpr)
      const W = 480
      const H = 600

      const bgGrad = ctx.createLinearGradient(0, 0, W, H)
      bgGrad.addColorStop(0, '#FFFDF7')
      bgGrad.addColorStop(0.6, '#FFF4DC')
      bgGrad.addColorStop(1, '#FFE8A3')
      ctx.fillStyle = bgGrad
      roundRect(ctx, 0, 0, W, H, 24)
      ctx.fill()

      ctx.font = '600 11px Inter, sans-serif'
      ctx.fillStyle = '#A08050'
      ctx.textAlign = 'center'
      ctx.fillText('WHAT CHEESE ARE YOU?', W / 2, 48)

      ctx.font = '64px serif'
      ctx.fillText('🧀', W / 2, 118)

      ctx.font = 'italic 400 13px Inter, sans-serif'
      ctx.fillStyle = '#A08050'
      ctx.fillText(displayedOpenerPhrase || 'A classic case.', W / 2, 150)

      ctx.font = '800 40px Inter, sans-serif'
      ctx.fillStyle = '#C8892A'
      ctx.fillText(result.cheeseName, W / 2, 200, W - 80)

      ctx.strokeStyle = 'rgba(200,137,42,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(40, 222)
      ctx.lineTo(W - 40, 222)
      ctx.stroke()

      ctx.font = '400 15px Inter, sans-serif'
      ctx.fillStyle = '#3A2A10'
      ctx.textAlign = 'left'
      const personalityText = (result.personality || '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .slice(0, 200)
      wrapText(ctx, personalityText, 40, 252, W - 80, 22)

      const paddedTraits = [
        (result.traits || [])[0] || 'Mysteriously complex',
        (result.traits || [])[1] || 'Quietly bold',
        (result.traits || [])[2] || 'Unexpectedly smooth',
      ].map((trait) => trait.replace(/\*\*/g, '').replace(/\*/g, '').trim())

      ctx.font = '500 13px Inter, sans-serif'
      ctx.fillStyle = '#8A5C10'
      ctx.textAlign = 'left'
      paddedTraits.forEach((trait, i) => {
        ctx.beginPath()
        ctx.arc(46, 352 + i * 26, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#D4A853'
        ctx.fill()
        ctx.fillStyle = '#8A5C10'
        ctx.fillText(trait.slice(0, 52), 58, 356 + i * 26)
      })

      ctx.strokeStyle = 'rgba(200,137,42,0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(40, 410)
      ctx.lineTo(W - 40, 410)
      ctx.stroke()

      ctx.font = '600 11px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('RIPENESS', 40, 438)

      ctx.fillStyle = '#F2E4C6'
      roundRect(ctx, 120, 426, W - 200, 10, 5)
      ctx.fill()

      const barFill = ((result.ripenessScore || 0) / 10) * (W - 200)
      const barGrad = ctx.createLinearGradient(120, 0, 120 + barFill, 0)
      barGrad.addColorStop(0, '#C8892A')
      barGrad.addColorStop(1, '#E8A838')
      ctx.fillStyle = barGrad
      roundRect(ctx, 120, 426, barFill, 10, 5)
      ctx.fill()

      ctx.font = '700 13px Inter, sans-serif'
      ctx.fillStyle = '#8A5C10'
      ctx.textAlign = 'right'
      ctx.fillText(`${result.ripenessScore}/10`, W - 40, 438)

      ctx.font = '400 11px Inter, sans-serif'
      ctx.fillStyle = '#C8A86A'
      ctx.textAlign = 'center'
      ctx.fillText('The Cheese Oracle', W / 2, H - 24)

      const link = document.createElement('a')
      link.download = `i-am-${(result.cheeseName || 'cheese').toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Share failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      {!isRevealed && (
        <div className="reveal-only-screen">
          <div className={`reveal-panel-standalone ${isPeeling ? 'is-peeling' : ''}`} onClick={handleReveal}>
            <div className="reveal-panel-content">
              <img src="/cheese_point.png" alt="" className="reveal-panel-cheese" />
              <p>Tap to reveal your cheese</p>
            </div>
          </div>
        </div>
      )}

      {isRevealed && (
        <article className="result-card animate-result-in">
          <div className="reveal-container text-center">
            <div className="py-6">
              <p className="opener-phrase is-visible">{displayedOpenerPhrase}</p>
              <h2 className="cheese-name cheese-name-reveal is-visible">
                {displayedCheeseName}
              </h2>
            </div>
          </div>

          <section>
            {parsed.hasStructuredSections ? (
              sections.map((section, index) => (
                <div
                  key={section.key}
                  className="section-block reveal-section is-visible"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <p className="section-label">{section.label}</p>
                  {section.key === 'traits' ? (
                    <CharacterTraitDiagram
                      imageSrc={result.characterImage}
                      traits={traitLines(parsed.traits).slice(0, 3)}
                    />
                  ) : section.key === 'ripeness' ? (
                    <CheeseWheel
                      score={result.ripenessScore}
                      description={stripMarkdown(parsed.ripeness || result.ripeness)}
                      mdComponents={mdComponents}
                    />
                  ) : (
                    <div className="section-copy markdown-content">
                      <ReactMarkdown components={mdComponents}>
                        {stripMarkdown(parsed[section.key] || result[section.key])}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="section-block reveal-section is-visible">
                <p className="section-label">Cheese Reading</p>
                <div className="section-copy markdown-content">
                  <ReactMarkdown components={mdComponents}>{result.rawText}</ReactMarkdown>
                </div>
              </div>
            )}
          </section>

          <div className="result-actions">
            <button
              type="button"
              className="share-image-btn"
              disabled={isGenerating}
              onClick={handleShare}
            >
              📸 {isGenerating ? 'Generating...' : 'Share as Image'}
            </button>
            <button type="button" onClick={onReset} className="try-again-btn">
              Try Another Vibe →
            </button>
          </div>
          <CheeseRunner characterImage={result.characterImage} />
        </article>
      )}
    </>
  )
}

export default ResultCard
