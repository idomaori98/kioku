import { useEffect, useRef } from 'react'

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

function loadGoogleScript() {
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export function GoogleButton({ onToken }) {
  const buttonRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    loadGoogleScript().then(() => {
      if (cancelled || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => onToken(response.credential),
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 280,
      })
    })

    return () => {
      cancelled = true
    }
  }, [onToken])

  return <div ref={buttonRef} />
}
