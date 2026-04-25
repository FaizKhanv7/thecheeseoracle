import { useEffect, useMemo, useState } from 'react'
import html2canvas from 'html2canvas'
import CheeseWheel from './CheeseWheel'
import HistoryPanel from './HistoryPanel'
import ResultCard from './ResultCard'
import { getCheeseCharacter } from './cheeseCharacters'
import './App.css'

const ORACLE_PROMPT = `You are the world's foremost Cheese Psychologist. When given any description of a mood, situation, vibe, or life event, you must:
1. Start with a short punchy opener phrase (max 5 words, e.g. 'Ah, a classic case!', 'Textbook, really.', 'Bold. Unexpected. Correct.', 'Oh, absolutely no question.', 'Rare but unmistakable.', 'This tracks completely.') then on the next line declare exactly which cheese this person is.
2. Give a concise 1-2 sentence dramatic personality analysis explaining WHY they are this cheese
3. List 3 'Cheese Traits' (short, funny, specific bullet points)
4. Give a 'Ripeness Level' from 1-10 and what it means (e.g. '7/10 — Boldly aged, slightly overwhelming at parties')
Format your response in clearly labeled sections. Be dramatic, funny, and oddly specific. Never be boring.`

const GEMINI_URL = '/api/gemini'

const LOADING_MESSAGES = [
  'Aging your cheese profile...',
  'Consulting the dairy oracles...',
  'Checking the caves of Roquefort...',
  'Analyzing your mold potential...',
  'Pairing you with the perfect wine...',
  'Cross-referencing the cheese wheel...',
]

const PLACEHOLDER_HINTS = [
  "I've had 3 coffees and I'm reorganizing my entire desk instead of working...",
  "It's Sunday evening and I keep opening the fridge hoping something new appeared...",
  "I replied to a text 6 days late with just a thumbs up emoji...",
  "I stayed up until 3am watching documentaries about medieval bridges...",
  "I cried at a dog food commercial then immediately ordered takeout...",
  "I have 47 tabs open and I'm productive about none of them...",
  `I just told someone their idea was "interesting" and meant it as an insult...`,
]

const DAILY_EMOJIS = ['🧀', '🫕', '🥧', '🫙', '🍕', '🥐', '🧇']

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

const extractSection = (text, heading, nextHeadings) => {
  const sectionRegex = new RegExp(
    `${heading}\\s*:?\\s*([\\s\\S]*?)(?=${nextHeadings.join('|')}|$)`,
    'i',
  )
  const match = text.match(sectionRegex)
  return match?.[1]?.trim() ?? ''
}

const parseResult = (rawText) => {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const prefaceLines = lines
    .filter((line) => !matchSectionKey(line))
    .map(cleanLine)
    .filter(Boolean)

  const openerPhrase =
    prefaceLines[0]?.replace(/^[-*#\d.\s]*/u, '').replace(/\*\*/g, '').replace(/\*/g, '').trim() ||
    'A classic case.'

  const rawCheeseLine = prefaceLines[1] || prefaceLines[0] || ''
  const cheeseName =
    rawCheeseLine
      .replace(/^[-*#\d.\s]*/u, '')
      .replace(/^(you are|you are\.\.\.|cheese)\s*[:\-]?\s*/iu, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim() || 'Mystery Cheese'
  const characterImage = getCheeseCharacter(cheeseName)

  const nextHeadings = [
    'Personality Analysis',
    'Cheese Traits',
    'Ripeness Level',
  ]
  const personality =
    extractSection(rawText, 'Personality Analysis', nextHeadings) ||
    extractSection(rawText, 'Analysis', nextHeadings)

  const traitsBlock = extractSection(rawText, 'Cheese Traits', nextHeadings)
  const traits = traitsBlock
    .split('\n')
    .map((trait) => trait.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3)

  const ripeness = extractSection(rawText, 'Ripeness Level', nextHeadings)

  const ripenessScore = Number.parseInt(ripeness.match(/\b([1-9]|10)\b/)?.[1] ?? '0', 10)

  return {
    rawText,
    openerPhrase,
    cheeseName,
    characterImage,
    personality: personality || rawText,
    traits,
    ripeness:
      ripeness || '6/10 - Quietly complex, unexpectedly intense once the conversation starts.',
    ripenessScore: Number.isNaN(ripenessScore) ? 0 : ripenessScore,
  }
}

const getTodayKey = () => {
  const d = new Date()
  return `cheese_horoscope_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`
}

const getTodayDisplay = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

const parseHoroscope = (rawText) => {
  const labels = [
    'CHEESE OF THE DAY',
    'COSMIC CHEESE READING',
    'LUCKY CHEESE PAIRING',
    'AVOID TODAY',
    'RIPENESS FORECAST',
  ]

  const extractByLabel = (label) => {
    const next = labels.filter((item) => item !== label).join('|')
    const regex = new RegExp(`${label}\\s*:?\\s*([\\s\\S]*?)(?=${next}|$)`, 'i')
    return rawText.match(regex)?.[1]?.trim() ?? ''
  }

  const cheeseName = extractByLabel('CHEESE OF THE DAY')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/, '')
    .trim()
  const reading = extractByLabel('COSMIC CHEESE READING')
  const pairing = extractByLabel('LUCKY CHEESE PAIRING')
  const avoid = extractByLabel('AVOID TODAY')
  const ripeness = extractByLabel('RIPENESS FORECAST')
  const ripenessScore = Number.parseInt(ripeness.match(/\b([1-9]|10)\b/)?.[1] ?? '0', 10)

  return {
    rawText,
    cheeseName: cheeseName || 'Comte Eclipse',
    reading: reading || rawText,
    pairing: pairing || 'A twilight walk and sparkling water.',
    avoid: avoid || 'Avoid arguing with anyone holding a fondue fork.',
    ripeness: ripeness || '6/10 - Cosmic curds are steady but mysterious.',
    ripenessScore: Number.isNaN(ripenessScore) ? 0 : ripenessScore,
  }
}

function App() {
  const [inputText, setInputText] = useState('')
  const [page, setPage] = useState('home')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shakeInput, setShakeInput] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [loadingMessageVisible, setLoadingMessageVisible] = useState(true)
  const [hintIndex, setHintIndex] = useState(0)
  const [hintVisible, setHintVisible] = useState(true)
  const [historyVersion, setHistoryVersion] = useState(0)
  const [horoscope, setHoroscope] = useState(null)
  const [horoscopeLoading, setHoroscopeLoading] = useState(false)
  const [horoscopeError, setHoroscopeError] = useState('')
  const [isGeneratingHoroscope, setIsGeneratingHoroscope] = useState(false)
  const [runnerHighScore, setRunnerHighScore] = useState(0)

  const charCount = useMemo(() => inputText.trim().length, [inputText])

  useEffect(() => {
    if (!loading) {
      setLoadingMessageIndex(0)
      setLoadingMessageVisible(true)
      return
    }

    const intervalId = window.setInterval(() => {
      setLoadingMessageVisible(false)
      window.setTimeout(() => {
        setLoadingMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length)
        setLoadingMessageVisible(true)
      }, 400)
    }, 1500)

    return () => window.clearInterval(intervalId)
  }, [loading])

  useEffect(() => {
    if (page !== 'home' || inputText.length > 0) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setHintVisible(false)
      window.setTimeout(() => {
        setHintIndex((current) => (current + 1) % PLACEHOLDER_HINTS.length)
        setHintVisible(true)
      }, 300)
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [inputText.length, page])

  useEffect(() => {
    const loadHoroscope = async () => {
      if (page !== 'horoscope') {
        return
      }

      setHoroscopeError('')
      setHoroscopeLoading(true)
      const cached = localStorage.getItem(getTodayKey())
      if (cached) {
        setHoroscope(JSON.parse(cached))
        setHoroscopeLoading(false)
        return
      }

      const today = getTodayDisplay()
      const horoscopePrompt = `You are the world's only Cheese Astrologer. Today is ${today}.

Generate today's Daily Cheese Horoscope with EXACTLY these section labels and nothing else:

CHEESE OF THE DAY:
[One specific unusual cheese]

COSMIC CHEESE READING:
[Exactly 1-2 sentences. Mystical but clear and grounded in plain English.
Use simple wording and one light cosmic reference at most.
No purple prose, no abstract metaphors, and no nonsense phrases.]

LUCKY CHEESE PAIRING:
[Format: one short noun phrase only, practical and concrete.
Example: "Sparkling water and a sunset walk".
No full sentences, no explanation. Max 8 words.]

AVOID TODAY:
[Format: one short noun phrase only, clear and relatable.
Example: "Overthinking small decisions".
No full sentences. Max 8 words.]

RIPENESS FORECAST:
[Number 1-10 followed by a dash and max 8 words, e.g. "7/10 - Bold moves are cosmically favored today."]

Be completely earnest and never break character.
Write for a general audience at about a middle-school reading level.`

      try {
        const response = await fetch(GEMINI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: horoscopePrompt }] }],
          }),
        })

        if (!response.ok) {
          throw new Error(`Gemini request failed with status ${response.status}`)
        }

        const data = await response.json()
        console.log('Raw Gemini horoscope response:', data)
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) {
          throw new Error('Gemini horoscope response did not include generated text')
        }
        const parsed = parseHoroscope(text)
        localStorage.setItem(getTodayKey(), JSON.stringify(parsed))
        setHoroscope(parsed)
      } catch (err) {
        console.error(err)
        setHoroscopeError('The dairy stars are cloudy right now. Please try again.')
      } finally {
        setHoroscopeLoading(false)
      }
    }

    loadHoroscope()
  }, [page])

  useEffect(() => {
    const bumpHistory = () => setHistoryVersion((current) => current + 1)
    window.addEventListener('cheese-history-updated', bumpHistory)
    return () => window.removeEventListener('cheese-history-updated', bumpHistory)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('cheese_runner_high_score')
    if (stored) setRunnerHighScore(parseInt(stored, 10))
  }, [])

  const saveToHistory = (nextInputText, cheeseName, rawText) => {
    const existing = JSON.parse(localStorage.getItem('cheese_history') || '[]')
    const newEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      inputText: nextInputText,
      cheeseName,
      rawText,
    }
    const updated = [newEntry, ...existing].slice(0, 20)
    localStorage.setItem('cheese_history', JSON.stringify(updated))
    setHistoryVersion((current) => current + 1)
  }

  const handleReset = () => {
    setInputText('')
    setResult(null)
    setError('')
    setPage('home')
  }

  const handleSelectHistory = (parsed) => {
    setResult(parsed)
    setPage('result')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!inputText.trim()) {
      setShakeInput(true)
      window.setTimeout(() => setShakeInput(false), 420)
      return
    }

    setPage('loading')
    setLoading(true)
    try {
      const prompt = `${ORACLE_PROMPT}\n\nUser description: ${inputText.trim()}`
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      })

      if (!response.ok) {
        throw new Error(`Gemini request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log('Raw Gemini response:', data)
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        throw new Error('Gemini response did not include generated text')
      }

      const parsed = parseResult(text)
      saveToHistory(inputText.trim(), parsed.cheeseName, text)
      setResult(parsed)
      setPage('result')
    } catch (submitError) {
      console.error(submitError)
      setError('The cheese oracle is temporarily unavailable. Please try again.')
      setPage('home')
    } finally {
      setLoading(false)
    }
  }

  const handleShareHoroscope = async () => {
    const node = document.getElementById('horoscope-share-card')
    if (!node || !horoscope) return
    setIsGeneratingHoroscope(true)
    try {
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `daily-cheese-horoscope-${horoscope.cheeseName
        .toLowerCase()
        .replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Share failed:', err)
    } finally {
      setIsGeneratingHoroscope(false)
    }
  }

  const dailyEmoji = DAILY_EMOJIS[new Date().getDay()]
  const navButtonStyle = {
    position: 'fixed',
    top: '20px',
    left: '20px',
    background: 'white',
    border: '1px solid #EDE8DC',
    borderRadius: '999px',
    padding: '6px 14px',
    fontSize: '0.85rem',
    color: '#8B6914',
    cursor: 'pointer',
    zIndex: 10,
  }

  return (
    <>
      <HistoryPanel
        onSelectHistory={handleSelectHistory}
        parseResult={parseResult}
        historyVersion={historyVersion}
      />
      <main className="min-h-screen px-5 py-10 sm:px-8">
        {page === 'home' && (
          <div className="page-enter mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[680px] flex-col justify-center">
            <header className="text-center">
              <h1 className="title-text animate-fade-up [animation-delay:100ms]">
                What <img src="/cheese_text.png" alt="Cheese" className="title-cheese-img" /> Are You?
              </h1>
              <p className="mt-5 text-lg text-[#6B6B6B] animate-fade-up [animation-delay:200ms]">
                Describe your mood, situation, or vibe. We&apos;ll handle the dairy science.
              </p>
            </header>

            {runnerHighScore > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '12px',
                  marginBottom: '-8px',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#FDF3DC',
                    border: '1px solid rgba(200,137,42,0.25)',
                    borderRadius: '999px',
                    padding: '5px 14px',
                    fontSize: '0.78rem',
                    color: '#8A5C10',
                    fontWeight: 500,
                  }}
                >
                  🏆 Cheese Runner best:{' '}
                  <strong style={{ color: '#C8892A' }}>{runnerHighScore}</strong>
                </div>
              </div>
            )}

            <form className="mt-10 animate-fade-up [animation-delay:300ms]" onSubmit={handleSubmit}>
              <div className="relative">
                {inputText.length === 0 && (
                  <p className={`rotating-hint ${hintVisible ? 'is-visible' : ''}`}>
                    {PLACEHOLDER_HINTS[hintIndex]}
                  </p>
                )}
                <textarea
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  rows={4}
                  placeholder=" "
                  className={`input-area ${shakeInput ? 'input-shake input-error-flash' : ''}`}
                />
                {charCount > 0 && (
                  <span className="pointer-events-none absolute bottom-4 left-4 text-xs text-[#8A8A8A]">
                    {charCount} chars
                  </span>
                )}
                <button type="submit" className="input-submit-btn" aria-label="Discover Your Cheese">
                  <img
                    src="/cheese_send.png"
                    alt="Discover Your Cheese"
                    style={{ width: '22px', height: '22px', objectFit: 'contain', display: 'block' }}
                  />
                </button>
              </div>
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setPage('horoscope')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#A08050',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                    textUnderlineOffset: '3px',
                    letterSpacing: '0.01em',
                  }}
                >
                  ✨ Read today&apos;s Cheese Horoscope
                </button>
              </div>

              {error && <p className="mt-3 text-sm text-[#B94A48]">{error}</p>}
            </form>
          </div>
        )}

        {page === 'loading' && (
          <div
            className="page-enter"
            style={{
              minHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <section className="loading-block">
              <div className="melting-cheese">🧀</div>
              <p className={`loading-message ${loadingMessageVisible ? 'is-visible' : ''}`}>
                {LOADING_MESSAGES[loadingMessageIndex]}
              </p>
            </section>
          </div>
        )}

        {page === 'result' && result && (
          <div className="result-page-wrapper">
            <ResultCard result={result} onReset={handleReset} />
          </div>
        )}

        {page === 'horoscope' && (
          <div className="page-enter mx-auto w-full max-w-[680px]">
            <button type="button" onClick={() => setPage('home')} style={navButtonStyle}>
              ← Back
            </button>
            <header className="mb-8 text-center">
              <h2 className="horoscope-title">Daily 🧀 Horoscope</h2>
              <p className="mt-3 text-[15px] text-[#A08050]">{getTodayDisplay()}</p>
            </header>

            {horoscopeLoading ? (
              <div
                style={{
                  minHeight: '80vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <section className="loading-block">
                  <div className="melting-cheese">🧀</div>
                  <p className="loading-message is-visible">Consulting the dairy stars...</p>
                </section>
              </div>
            ) : horoscope ? (
              <>
                <article className="result-card">
                  <div className="text-center">
                    <div className="text-6xl">{dailyEmoji}</div>
                    <p className="mb-2 mt-4 text-[11px] uppercase tracking-[0.24em] text-[#8B8B8B]">
                      Today You Are...
                    </p>
                    <h2 className="cheese-name">{horoscope.cheeseName}</h2>
                  </div>
                  <div className="my-8 h-px bg-[#ECECEC]" />
                  <div className="section-block">
                    <p className="section-label">⭐ Cosmic Cheese Reading</p>
                    <p className="section-copy">{horoscope.reading}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div
                      style={{
                        flex: 1,
                        background: '#FDFAF4',
                        border: '1px solid #EDE8DC',
                        borderRadius: '16px',
                        padding: '1rem 1.1rem',
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 6px',
                          fontSize: '0.68rem',
                          letterSpacing: '0.2em',
                          fontWeight: 700,
                          color: '#A08050',
                          textTransform: 'uppercase',
                        }}
                      >
                        💫 Lucky Pairing
                      </p>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#2A2218', lineHeight: 1.5 }}>
                        {horoscope.pairing}
                      </p>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        background: '#FDFAF4',
                        border: '1px solid #EDE8DC',
                        borderRadius: '16px',
                        padding: '1rem 1.1rem',
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 6px',
                          fontSize: '0.68rem',
                          letterSpacing: '0.2em',
                          fontWeight: 700,
                          color: '#A08050',
                          textTransform: 'uppercase',
                        }}
                      >
                        ⚠️ Avoid Today
                      </p>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#2A2218', lineHeight: 1.5 }}>
                        {horoscope.avoid}
                      </p>
                    </div>
                  </div>
                  <div className="section-block">
                    <p className="section-label">🧀 Ripeness Forecast</p>
                    <CheeseWheel
                      score={horoscope.ripenessScore}
                      description={horoscope.ripeness}
                      mdComponents={undefined}
                    />
                  </div>
                  <div className="result-actions">
                    <button
                      type="button"
                      className="share-image-btn"
                      disabled={isGeneratingHoroscope}
                      onClick={handleShareHoroscope}
                    >
                      📸 {isGeneratingHoroscope ? 'Generating...' : 'Share as Image'}
                    </button>
                  </div>
                </article>

                <div
                  id="horoscope-share-card"
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: 0,
                    width: '480px',
                    background: 'linear-gradient(145deg, #FFFDF7 0%, #FFF4DC 60%, #FFE8A3 100%)',
                    padding: '48px 40px 36px',
                    fontFamily: 'Inter, sans-serif',
                    borderRadius: '24px',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: '11px',
                      letterSpacing: '0.25em',
                      textTransform: 'uppercase',
                      color: '#A08050',
                      fontWeight: 600,
                    }}
                  >
                    Daily Cheese Horoscope
                  </p>
                  <div style={{ fontSize: '72px', lineHeight: 1, margin: '16px 0' }}>{dailyEmoji}</div>
                  <h1
                    style={{
                      margin: '0 0 24px',
                      fontSize: '38px',
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.1,
                      color: '#C8892A',
                    }}
                  >
                    {horoscope.cheeseName}
                  </h1>
                  <p style={{ margin: '0 0 20px', fontSize: '15px', lineHeight: 1.65, color: '#3A2A10' }}>
                    {horoscope.reading}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(200,137,42,0.25)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      textAlign: 'center',
                    }}>
                      <p style={{ margin: '0 0 5px', fontSize: '10px', letterSpacing: '0.18em', fontWeight: 700, color: '#A08050', textTransform: 'uppercase' }}>💫 Lucky Pairing</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#3A2A10', lineHeight: 1.5 }}>{horoscope.pairing}</p>
                    </div>
                    <div style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(200,137,42,0.25)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      textAlign: 'center',
                    }}>
                      <p style={{ margin: '0 0 5px', fontSize: '10px', letterSpacing: '0.18em', fontWeight: 700, color: '#A08050', textTransform: 'uppercase' }}>⚠️ Avoid Today</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#3A2A10', lineHeight: 1.5 }}>{horoscope.avoid}</p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', letterSpacing: '0.15em', color: '#C8A86A', textTransform: 'uppercase', fontWeight: 500 }}>
                    The Cheese Oracle
                  </p>
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-[#B94A48]">
                {horoscopeError || 'The dairy stars are unavailable right now.'}
              </p>
            )}
          </div>
        )}
      </main>
    </>
  )
}

export default App
