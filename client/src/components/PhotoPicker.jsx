import { useRef, useState } from 'react'
import { api } from '../api'
import { resizeImage } from '../lib/imageResize'

export function PhotoPicker({ tripId, day, onSaved, onClose }) {
  const [files, setFiles] = useState([])
  const [batchNote, setBatchNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const cameraInput = useRef(null)
  const galleryInput = useRef(null)

  function addFiles(fileList) {
    const picked = Array.from(fileList)
    setFiles((prev) => [
      ...prev,
      ...picked.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ])
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (files.length === 0) return
    setUploading(true)
    setError(null)
    setProgress(0)
    const uploaded = []
    try {
      for (const { file } of files) {
        const blob = await resizeImage(file)
        const { uploadUrl, key, publicUrl } = await api.getPhotoUploadUrl(tripId, 'image/jpeg')
        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          body: blob,
        })
        if (!res.ok) throw new Error('Upload to storage failed')
        const photo = await api.createPhoto(tripId, { day, key, publicUrl, note: batchNote })
        uploaded.push(photo)
        setProgress((p) => p + 1)
      }
      onSaved(uploaded)
    } catch (err) {
      setError(err.message)
      setUploading(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={uploading ? undefined : onClose}>
      <div className="sheet photo-picker" onClick={(e) => e.stopPropagation()}>
        <div className="photo-source-row">
          <button type="button" onClick={() => cameraInput.current?.click()}>
            📷 Camera
          </button>
          <button type="button" onClick={() => galleryInput.current?.click()}>
            🖼️ Gallery
          </button>
        </div>
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {files.length > 0 && (
          <div className="photo-preview-grid">
            {files.map((f, i) => (
              <div key={f.preview} className="photo-preview">
                <span className="photo-preview-number">{i + 1}</span>
                <img src={f.preview} alt="" />
                {!uploading && (
                  <button type="button" className="photo-preview-remove" onClick={() => removeFile(i)}>
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <textarea
          placeholder="Note for this batch (optional)"
          value={batchNote}
          onChange={(e) => setBatchNote(e.target.value)}
          disabled={uploading}
        />

        {error && <p className="error">{error}</p>}

        <button type="button" onClick={handleUpload} disabled={files.length === 0 || uploading}>
          {uploading ? `Uploading ${progress}/${files.length}...` : `Upload ${files.length} photo${files.length === 1 ? '' : 's'}`}
        </button>
        <button type="button" className="sheet-cancel" onClick={onClose} disabled={uploading}>
          Cancel
        </button>
      </div>
    </div>
  )
}
