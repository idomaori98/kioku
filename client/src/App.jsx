import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div>
      <h1>記憶 Kioku</h1>
      {error && <p style={{ color: 'crimson' }}>API error: {error}</p>}
      {!error && !health && <p>Loading...</p>}
      {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
    </div>
  )
}

export default App
