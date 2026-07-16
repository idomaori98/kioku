import { useRef, useState } from 'react'
import { api } from '../api'
import { LogOutIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { resizeImage } from '../lib/imageResize'

export function ProfilePage() {
  const { user, setUser, logout } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInput = useRef(null)

  async function handleFileChange(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const blob = await resizeImage(file)
      const { uploadUrl, publicUrl } = await api.getProfilePhotoUploadUrl('image/jpeg')
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      })
      if (!res.ok) throw new Error('Upload to storage failed')
      const updated = await api.updateProfilePhoto(publicUrl)
      setUser(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>Your profile</h1>
      <div className="avatar-large">
        {user.photoUrl ? (
          <img src={user.photoUrl} alt={user.name} />
        ) : (
          <span>{user.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <p>{user.name}</p>
      <p>{user.email}</p>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />
      <button onClick={() => fileInput.current?.click()} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Change profile photo'}
      </button>
      {error && <p className="error">{error}</p>}

      <button type="button" className="profile-logout" onClick={logout}>
        <LogOutIcon /> Log out
      </button>
    </div>
  )
}
