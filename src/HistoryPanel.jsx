import { useMemo, useState } from 'react'

const getRelativeTime = (timestamp) => {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function HistoryPanel({ onSelectHistory, parseResult, historyVersion }) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // item id or 'all'

  const historyItems = useMemo(() => {
    const items = JSON.parse(localStorage.getItem('cheese_history') || '[]')
    return Array.isArray(items) ? items : []
  }, [historyVersion])

  const removeItem = (id) => {
    const items = JSON.parse(localStorage.getItem('cheese_history') || '[]')
    const updated = items.filter((item) => item.id !== id)
    localStorage.setItem('cheese_history', JSON.stringify(updated))
    window.dispatchEvent(new Event('cheese-history-updated'))
    setConfirmDelete(null)
  }

  const clearAll = () => {
    localStorage.setItem('cheese_history', JSON.stringify([]))
    window.dispatchEvent(new Event('cheese-history-updated'))
    setConfirmDelete(null)
  }

  const handleSelect = (item) => {
    const parsed = parseResult(item.rawText)
    onSelectHistory(parsed)
    setOpen(false)
  }

  return (
    <div className="history-shell">
      <button
        type="button"
        className="history-tab"
        onClick={() => setOpen(true)}
        style={{
          opacity: open ? 0 : 1,
          pointerEvents: open ? 'none' : 'auto',
          transition: 'opacity 200ms ease',
        }}
      >
        HISTORY
      </button>

      <aside className={`history-panel ${open ? 'is-open' : ''}`}>
        <div className="history-panel-header">
          <p>Past Readings</p>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close history panel">
            ×
          </button>
        </div>

        <div className="history-items">
          {historyItems.length === 0 ? (
            <p className="history-empty">No readings yet.</p>
          ) : (
            historyItems.map((item) => (
              <article
                key={item.id}
                className="history-item"
                onClick={() => handleSelect(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleSelect(item)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <button
                  type="button"
                  className="history-delete"
                  onClick={(event) => {
                    event.stopPropagation()
                    setConfirmDelete(item.id)
                  }}
                  aria-label="Delete reading"
                >
                  ×
                </button>
                <p className="history-cheese">🧀 {item.cheeseName}</p>
                <p className="history-input">"{item.inputText}"</p>
                <p className="history-time">{getRelativeTime(item.timestamp)}</p>
              </article>
            ))
          )}
        </div>

        <button type="button" className="history-clear" onClick={() => setConfirmDelete('all')}>
          Clear all
        </button>
      </aside>

      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">
              {confirmDelete === 'all'
                ? 'Clear all readings?'
                : 'Delete this reading?'}
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-ok"
                onClick={() => confirmDelete === 'all' ? clearAll() : removeItem(confirmDelete)}
              >
                {confirmDelete === 'all' ? 'Clear all' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryPanel
