import { useEffect, useRef, useState } from 'react'

export default function CharacterTraitDiagram({ imageSrc, traits }) {
  const diagramRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [visibleCount, setVisibleCount] = useState(0)
  const [isInView, setIsInView] = useState(false)

  const paddedTraits = [
    traits[0] || 'Mysteriously complex',
    traits[1] || 'Quietly bold',
    traits[2] || 'Unexpectedly smooth',
  ].map((t) => t.replace(/\*\*/g, '').replace(/\*/g, '').trim())

  useEffect(() => {
    const node = diagramRef.current
    if (!node) return undefined
    setIsInView(false)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [traits])

  useEffect(() => {
    if (!isInView) return undefined
    setVisibleCount(0)
    const t1 = window.setTimeout(() => setVisibleCount(1), 80)
    const t2 = window.setTimeout(() => setVisibleCount(2), 210)
    const t3 = window.setTimeout(() => setVisibleCount(3), 340)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [isInView, traits])

  return (
    <div
      ref={diagramRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        marginTop: '12px',
        minHeight: '160px',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          alignItems: 'flex-end',
          flex: 1,
        }}
      >
        {paddedTraits.slice(0, 2).map((trait, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              opacity: visibleCount > i ? 1 : 0,
              transform: visibleCount > i ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 260ms ease, transform 260ms ease',
            }}
          >
            <TraitBubble trait={trait} side="left" />
            <div
              style={{
                width: '32px',
                height: '2px',
                background: 'linear-gradient(90deg, #E8C97A, #D4A853)',
                borderRadius: '999px',
              }}
            />
          </div>
        ))}
      </div>

      <div
        className="trait-diagram-image"
        style={{
          width: '120px',
          height: '140px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <img
          src={imageSrc}
          alt="Cheese character"
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 400ms ease',
            filter: 'drop-shadow(0 8px 16px rgba(200,137,42,0.25))',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            opacity: visibleCount > 2 ? 1 : 0,
            transform: visibleCount > 2 ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 260ms ease, transform 260ms ease',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '2px',
              background: 'linear-gradient(90deg, #D4A853, #E8C97A)',
              borderRadius: '999px',
            }}
          />
          <TraitBubble trait={paddedTraits[2]} side="right" />
        </div>
      </div>
    </div>
  )
}

function TraitBubble({ trait, side }) {
  return (
    <div
      className="trait-bubble"
      style={{
        background: '#FDF3DC',
        border: '1px solid rgba(200,137,42,0.3)',
        borderRadius: '12px',
        padding: '8px 12px',
        maxWidth: '140px',
        fontSize: '0.82rem',
        textAlign: side === 'left' ? 'right' : 'left',
      }}
    >
      <p
        style={{
          margin: 0,
          fontWeight: 500,
          color: '#8A5C10',
          lineHeight: 1.4,
        }}
      >
        {trait}
      </p>
    </div>
  )
}
