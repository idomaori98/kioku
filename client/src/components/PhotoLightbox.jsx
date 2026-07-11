export function PhotoLightbox({ photo, onClose }) {
  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <img src={photo.url} alt={photo.note || ''} className="lightbox-img" />
      {photo.note && <p className="lightbox-caption">{photo.note}</p>}
    </div>
  )
}
