import { useEffect, useRef, useState, useCallback } from 'react'

const GRAVITY = 0.6
const JUMP_FORCE = -13
const GROUND_Y = 120
const GAME_SPEED_INITIAL = 4
const OBSTACLE_INTERVAL_MIN = 60
const OBSTACLE_INTERVAL_MAX = 120

export default function CheeseRunner({ characterImage }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const animFrameRef = useRef(null)
  const [gameState, setGameState] = useState('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const charImgRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('cheese_runner_high_score')
    if (stored) setHighScore(parseInt(stored, 10))
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = characterImage
    img.onload = () => {
      charImgRef.current = img
    }
  }, [characterImage])

  const initGame = useCallback(() => {
    gameRef.current = {
      player: {
        x: 80,
        y: GROUND_Y,
        vy: 0,
        isGrounded: true,
        width: 56,
        height: 64,
      },
      obstacles: [],
      frameCount: 0,
      score: 0,
      speed: GAME_SPEED_INITIAL,
      nextObstacleIn: 80,
      running: true,
    }
  }, [])

  const jump = useCallback(() => {
    if (gameState === 'idle' || gameState === 'dead') {
      initGame()
      setGameState('playing')
      setScore(0)
      return
    }
    if (!gameRef.current) return
    const player = gameRef.current.player
    if (player.isGrounded) {
      player.vy = JUMP_FORCE
      player.isGrounded = false
    }
  }, [gameState, initGame])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        jump()
      }
    }
    const onTouch = () => jump()
    window.addEventListener('keydown', onKey)
    const canvas = canvasRef.current
    if (canvas) canvas.addEventListener('touchstart', onTouch)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (canvas) canvas.removeEventListener('touchstart', onTouch)
    }
  }, [jump])

  useEffect(() => {
    if (gameState !== 'playing') return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width / window.devicePixelRatio || 600
    const H = canvas.height / window.devicePixelRatio || 160
    const groundY = H - 40

    const loop = () => {
      if (!gameRef.current?.running) return
      const g = gameRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const dpr = window.devicePixelRatio || 1
      ctx.save()
      ctx.scale(dpr, dpr)

      ctx.strokeStyle = 'rgba(200,137,42,0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, groundY)
      ctx.lineTo(W, groundY)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(200,137,42,0.15)'
      ctx.lineWidth = 1
      ctx.setLineDash([20, 15])
      ctx.lineDashOffset = -(g.frameCount * g.speed) % 35
      ctx.beginPath()
      ctx.moveTo(0, groundY + 8)
      ctx.lineTo(W, groundY + 8)
      ctx.stroke()
      ctx.setLineDash([])

      const p = g.player
      p.vy += GRAVITY
      p.y += p.vy
      const playerGroundY = groundY - p.height
      if (p.y >= playerGroundY) {
        p.y = playerGroundY
        p.vy = 0
        p.isGrounded = true
      }

      if (charImgRef.current) {
        ctx.drawImage(charImgRef.current, p.x - p.width / 2, p.y, p.width, p.height)
      } else {
        ctx.font = '40px serif'
        ctx.fillText('🧀', p.x - 20, p.y + p.height)
      }

      g.nextObstacleIn--
      if (g.nextObstacleIn <= 0) {
        g.obstacles.push({
          x: W + 20,
          y: groundY - 32,
          width: 28,
          height: 28,
        })
        g.nextObstacleIn =
          OBSTACLE_INTERVAL_MIN +
          Math.floor(Math.random() * (OBSTACLE_INTERVAL_MAX - OBSTACLE_INTERVAL_MIN))
      }

      g.obstacles = g.obstacles.filter((obs) => obs.x > -40)
      g.obstacles.forEach((obs) => {
        obs.x -= g.speed
        ctx.font = '26px serif'
        ctx.fillText('🐭', obs.x, obs.y + obs.height)

        const hitboxPad = 10
        const playerLeft = p.x - p.width / 2 + hitboxPad
        const playerRight = p.x + p.width / 2 - hitboxPad
        const playerBottom = p.y + p.height - 4
        const obsLeft = obs.x + 4
        const obsRight = obs.x + obs.width - 4
        const obsTop = obs.y + 4

        if (playerRight > obsLeft && playerLeft < obsRight && playerBottom > obsTop) {
          g.running = false
          const finalScore = Math.floor(g.score)
          setScore(finalScore)
          setGameState('dead')

          const stored = parseInt(localStorage.getItem('cheese_runner_high_score') || '0', 10)
          if (finalScore > stored) {
            localStorage.setItem('cheese_runner_high_score', finalScore.toString())
            setHighScore(finalScore)
          }
          ctx.restore()
          return
        }
      })

      g.score += 0.1
      g.speed = GAME_SPEED_INITIAL + Math.floor(g.score / 10) * 0.3
      g.frameCount++
      setScore(Math.floor(g.score))

      ctx.font = '600 13px Inter, sans-serif'
      ctx.fillStyle = 'rgba(160,128,80,0.6)'
      ctx.textAlign = 'right'
      ctx.fillText(`${Math.floor(g.score)}`, W - 16, 20)
      ctx.textAlign = 'left'

      ctx.restore()
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [gameState])

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const W = 600
  const H = 160

  return (
    <div
      style={{
        marginTop: '32px',
        borderRadius: '20px',
        background: '#FDFAF4',
        border: '1px solid #EDE8DC',
        padding: '20px',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.68rem',
            letterSpacing: '0.2em',
            fontWeight: 700,
            color: '#A08050',
            textTransform: 'uppercase',
          }}
        >
          🎮 Cheese Runner
        </p>
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            color: '#C8A86A',
            fontWeight: 500,
          }}
        >
          Best: {highScore}
        </p>
      </div>

      <div
        style={{ position: 'relative', cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }}
        onClick={jump}
      >
        <canvas
          ref={canvasRef}
          width={W * dpr}
          height={H * dpr}
          style={{
            width: '100%',
            height: `${H}px`,
            display: 'block',
            borderRadius: '12px',
            background: 'linear-gradient(180deg, #FFFDF7 0%, #FFF8E8 100%)',
          }}
        />

        {gameState === 'idle' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(253,250,244,0.85)',
              borderRadius: '12px',
              gap: '6px',
            }}
          >
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#8A5C10' }}>
              🧀 Cheese Runner
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#A08050' }}>
              Press{' '}
              <kbd
                style={{
                  background: '#EDE8DC',
                  border: '1px solid #D4A853',
                  borderRadius: '4px',
                  padding: '1px 6px',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  color: '#8A5C10',
                }}
              >
                SPACE
              </kbd>{' '}
              or tap to start
            </p>
          </div>
        )}

        {gameState === 'dead' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(253,250,244,0.9)',
              borderRadius: '12px',
              gap: '4px',
            }}
          >
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#8A5C10' }}>Got eaten! 🐭</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#A08050' }}>
              Score: <strong style={{ color: '#C8892A' }}>{score}</strong>
              {score === highScore && score > 0 && (
                <span style={{ marginLeft: '8px', color: '#C8892A', fontSize: '0.78rem' }}>
                  🏆 New best!
                </span>
              )}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#C8A86A' }}>
              Tap or press SPACE to retry
            </p>
          </div>
        )}
      </div>

      {gameState === 'playing' && (
        <p
          style={{
            margin: '8px 0 0',
            fontSize: '0.72rem',
            color: '#C8A86A',
            textAlign: 'center',
          }}
        >
          Dodge the mice — tap or press SPACE to jump
        </p>
      )}
    </div>
  )
}
