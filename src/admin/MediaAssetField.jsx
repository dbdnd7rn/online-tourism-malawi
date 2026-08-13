import { useId, useState } from 'react'
import { Check, CloudUpload, FileAudio, FileVideo, Image, LoaderCircle, X } from 'lucide-react'
import { mediaKinds, uploadMediaAsset } from '../services/mediaService'

const kindIcon = { image: Image, audio: FileAudio, video: FileVideo }

export default function MediaAssetField({ field, value, onChange }) {
  const inputId = useId()
  const kinds = field.assetKinds || [field.assetKind || 'image']
  const [kind, setKind] = useState(kinds[0])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const Icon = kindIcon[kind] || CloudUpload

  const upload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const asset = await uploadMediaAsset(file, kind, {
        title: file.name.replace(/\.[^.]+$/, ''),
        alt_text: kind === 'image' ? field.label : null,
      })
      onChange(asset.public_url, asset)
    } catch (reason) {
      setError(reason.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-asset-field">
      {kinds.length > 1 ? (
        <div className="admin-asset-kind" aria-label="Media file type">
          {kinds.map((entry) => <button type="button" className={kind === entry ? 'active' : ''} onClick={() => setKind(entry)} key={entry}>{mediaKinds[entry].label}</button>)}
        </div>
      ) : null}
      <div className="admin-asset-actions">
        <input id={inputId} type="file" accept={mediaKinds[kind].accept} onChange={upload} disabled={uploading} />
        <label htmlFor={inputId} className={uploading ? 'busy' : ''}>{uploading ? <LoaderCircle className="spin" size={17} /> : <Icon size={17} />} {uploading ? 'Uploading securely…' : `Upload ${mediaKinds[kind].label.toLowerCase()}`}</label>
        {value ? <button type="button" onClick={() => onChange('', null)} aria-label={`Remove selected ${field.label}`}><X size={16} /></button> : null}
      </div>
      <div className="admin-asset-url">
        <span>{value ? <Check size={14} /> : <CloudUpload size={14} />}</span>
        <input type="url" required={field.required} value={value || ''} onChange={(event) => onChange(event.target.value, null)} placeholder="Or paste a trusted public URL" />
      </div>
      {error ? <small className="admin-asset-error" role="alert">{error}</small> : null}
    </div>
  )
}
