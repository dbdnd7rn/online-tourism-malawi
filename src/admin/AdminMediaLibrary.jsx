import { useEffect, useMemo, useState } from 'react'
import { Check, Clipboard, CloudUpload, FileAudio, FileText, FileVideo, Image, LoaderCircle, Pencil, RefreshCw, Search, ShieldCheck, Trash2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { deleteMediaAsset, formatFileSize, loadMediaAssets, mediaKinds, updateMediaAsset, uploadMediaAsset } from '../services/mediaService'

const icons = { image: Image, audio: FileAudio, video: FileVideo, document: FileText }
const emptyMetadata = { title: '', alt_text: '', credit_line: '', rights_holder: '', license: '', source_url: '', consent_status: 'not_required' }

const dateLabel = (value) => new Intl.DateTimeFormat('en-MW', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))

export default function AdminMediaLibrary() {
  const { configured } = useAuth()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(configured)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [toast, setToast] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try { setAssets(await loadMediaAssets()) }
    catch (reason) { setError(reason.message || 'Unable to load the media library.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!configured) return undefined
    let active = true
    loadMediaAssets()
      .then((items) => { if (active) setAssets(items) })
      .catch((reason) => { if (active) setError(reason.message || 'Unable to load the media library.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [configured])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filtered = useMemo(() => assets.filter((asset) => {
    const matchesKind = kind === 'all' || asset.asset_kind === kind
    const text = `${asset.title || ''} ${asset.file_name} ${asset.credit_line || ''}`.toLowerCase()
    return matchesKind && text.includes(query.trim().toLowerCase())
  }), [assets, kind, query])

  const remove = async () => {
    if (!deleteCandidate) return
    try {
      await deleteMediaAsset(deleteCandidate)
      setAssets((current) => current.filter((asset) => asset.id !== deleteCandidate.id))
      setDeleteCandidate(null)
      setToast('Asset removed from storage')
    } catch (reason) { setError(reason.message || 'Unable to remove the asset.') }
  }

  return (
    <div className="admin-media-page">
      <header className="admin-page-header">
        <div><small>Managed assets</small><h1>Media library</h1><p>Upload production-ready images, audio, video and documents with rights and consent information attached.</p></div>
        <div><button className="admin-secondary-action" onClick={load} disabled={!configured}><RefreshCw size={16} /> Refresh</button><button className="admin-primary-action" onClick={() => setUploadOpen(true)} disabled={!configured}><CloudUpload size={17} /> Upload asset</button></div>
      </header>

      {!configured ? <div className="admin-notice"><span><ShieldCheck size={21} /></span><div><strong>Production storage is locked</strong><p>Connect Supabase to upload persistent media. Preview mode never stores local files as public assets.</p></div></div> : null}
      {error ? <div className="admin-notice admin-notice--error"><span><X size={21} /></span><div><strong>Media action needs attention</strong><p>{error}</p></div></div> : null}

      <section className="admin-media-summary" aria-label="Media library statistics">
        {Object.entries(mediaKinds).map(([entry, rules]) => { const Icon = icons[entry]; const count = assets.filter((asset) => asset.asset_kind === entry).length; return <article key={entry}><span><Icon size={19} /></span><strong>{count}</strong><small>{rules.label} files</small></article> })}
        <article><span><ShieldCheck size={19} /></span><strong>{assets.filter((asset) => asset.credit_line && asset.rights_holder).length}</strong><small>Rights complete</small></article>
      </section>

      <section className="admin-media-panel">
        <div className="admin-resource-toolbar">
          <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search media and credits…" /></label>
          <div><button className={kind === 'all' ? 'active' : ''} onClick={() => setKind('all')}>All</button>{Object.keys(mediaKinds).map((entry) => <button className={kind === entry ? 'active' : ''} onClick={() => setKind(entry)} key={entry}>{mediaKinds[entry].label}</button>)}</div>
        </div>
        {loading ? <div className="admin-media-loading"><LoaderCircle className="spin" /> Loading managed media…</div> : filtered.length ? (
          <div className="admin-media-grid">
            {filtered.map((asset) => <MediaAssetCard asset={asset} key={asset.id} onEdit={() => setEditing(asset)} onDelete={() => setDeleteCandidate(asset)} onCopy={() => { navigator.clipboard.writeText(asset.public_url); setToast('Public URL copied') }} />)}
          </div>
        ) : <div className="admin-media-empty"><CloudUpload size={25} /><h2>No assets in this view</h2><p>Upload the first file or adjust the active filters.</p></div>}
      </section>

      {uploadOpen ? <UploadAssetDrawer onClose={() => setUploadOpen(false)} onUploaded={(asset) => { setAssets((current) => [asset, ...current]); setUploadOpen(false); setToast('Asset uploaded securely') }} /> : null}
      {editing ? <EditAssetDrawer asset={editing} onClose={() => setEditing(null)} onSaved={(asset) => { setAssets((current) => current.map((item) => item.id === asset.id ? asset : item)); setEditing(null); setToast('Media details updated') }} /> : null}
      {deleteCandidate ? <div className="admin-confirm-layer"><div className="admin-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-asset-title"><span><Trash2 size={22} /></span><small>Storage removal</small><h2 id="delete-asset-title">Remove {deleteCandidate.title || deleteCandidate.file_name}?</h2><p>The file and its rights metadata will be removed. First replace any content fields that still use this public URL.</p><div><button className="admin-secondary-action" onClick={() => setDeleteCandidate(null)}>Cancel</button><button className="admin-danger-action" onClick={remove}>Remove asset</button></div></div></div> : null}
      {toast ? <div className="admin-toast" role="status"><span><Check size={16} /></span>{toast}</div> : null}
    </div>
  )
}

function MediaAssetCard({ asset, onEdit, onDelete, onCopy }) {
  const Icon = icons[asset.asset_kind] || FileText
  return <article className="admin-media-card">
    <div className="admin-media-card__preview">{asset.asset_kind === 'image' ? <img src={asset.public_url} alt={asset.alt_text || ''} loading="lazy" /> : asset.asset_kind === 'audio' ? <audio controls preload="none" src={asset.public_url} /> : asset.asset_kind === 'video' ? <video controls preload="metadata" src={asset.public_url} /> : <span><FileText size={36} /></span>}<i>{asset.asset_kind}</i></div>
    <div className="admin-media-card__body"><small>{dateLabel(asset.created_at)} · {formatFileSize(asset.file_size)}</small><h2>{asset.title || asset.file_name}</h2><p>{asset.credit_line || 'Credit information still needed'}</p><div><button onClick={onCopy}><Clipboard size={15} /> Copy URL</button><button onClick={onEdit} aria-label={`Edit ${asset.title || asset.file_name}`}><Pencil size={15} /></button><button className="danger" onClick={onDelete} aria-label={`Delete ${asset.title || asset.file_name}`}><Trash2 size={15} /></button></div></div>
  </article>
}

function UploadAssetDrawer({ onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [kind, setKind] = useState('image')
  const [metadata, setMetadata] = useState(emptyMetadata)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    if (!file) { setError('Choose a file to upload.'); return }
    setBusy(true); setError('')
    try { onUploaded(await uploadMediaAsset(file, kind, metadata)) }
    catch (reason) { setError(reason.message || 'Unable to upload this file.') }
    finally { setBusy(false) }
  }
  return <AssetDrawer title="Upload a managed asset" eyebrow="Secure storage" onClose={onClose}><form onSubmit={submit}><div className="admin-editor-fields"><label className="wide"><span>File type</span><select value={kind} onChange={(event) => { setKind(event.target.value); setFile(null) }}>{Object.entries(mediaKinds).map(([value, rules]) => <option value={value} key={value}>{rules.label}</option>)}</select></label><label className="wide admin-file-drop"><input type="file" accept={mediaKinds[kind].accept} onChange={(event) => setFile(event.target.files?.[0] || null)} required /><span><CloudUpload size={23} /><strong>{file ? file.name : `Choose a ${mediaKinds[kind].label.toLowerCase()} file`}</strong><small>{file ? formatFileSize(file.size) : `Maximum ${formatFileSize(mediaKinds[kind].maxBytes)}`}</small></span></label><MetadataFields kind={kind} metadata={metadata} setMetadata={setMetadata} /></div>{error ? <div className="admin-form-error" role="alert">{error}</div> : null}<footer><button type="button" className="admin-secondary-action" onClick={onClose}>Cancel</button><button className="admin-primary-action" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> Uploading…</> : <><CloudUpload size={17} /> Upload asset</>}</button></footer></form></AssetDrawer>
}

function EditAssetDrawer({ asset, onClose, onSaved }) {
  const [metadata, setMetadata] = useState(Object.fromEntries(Object.keys(emptyMetadata).map((key) => [key, asset[key] ?? emptyMetadata[key]])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(''); try { onSaved(await updateMediaAsset(asset.id, metadata)) } catch (reason) { setError(reason.message || 'Unable to update this asset.') } finally { setBusy(false) } }
  return <AssetDrawer title={asset.title || asset.file_name} eyebrow="Rights & presentation" onClose={onClose}><form onSubmit={submit}><div className="admin-editor-fields"><MetadataFields kind={asset.asset_kind} metadata={metadata} setMetadata={setMetadata} /></div>{error ? <div className="admin-form-error" role="alert">{error}</div> : null}<footer><button type="button" className="admin-secondary-action" onClick={onClose}>Cancel</button><button className="admin-primary-action" disabled={busy}>{busy ? 'Saving…' : <><Check size={17} /> Save metadata</>}</button></footer></form></AssetDrawer>
}

function MetadataFields({ kind, metadata, setMetadata }) {
  const change = (key, value) => setMetadata((current) => ({ ...current, [key]: value }))
  return <><label className="wide"><span>Editorial title *</span><input required value={metadata.title} onChange={(event) => change('title', event.target.value)} /></label>{kind === 'image' ? <label className="wide"><span>Alternative text *</span><textarea required rows="3" value={metadata.alt_text} onChange={(event) => change('alt_text', event.target.value)} /></label> : null}<label><span>Credit line</span><input value={metadata.credit_line} onChange={(event) => change('credit_line', event.target.value)} /></label><label><span>Rights holder</span><input value={metadata.rights_holder} onChange={(event) => change('rights_holder', event.target.value)} /></label><label><span>Licence</span><input value={metadata.license} onChange={(event) => change('license', event.target.value)} placeholder="CC BY 4.0, permission, public domain…" /></label><label><span>Consent status</span><select value={metadata.consent_status} onChange={(event) => change('consent_status', event.target.value)}><option value="not_required">Not required</option><option value="pending">Pending</option><option value="granted">Granted</option><option value="restricted">Restricted</option></select></label><label className="wide"><span>Source or evidence URL</span><input type="url" value={metadata.source_url} onChange={(event) => change('source_url', event.target.value)} /></label></>
}

function AssetDrawer({ title, eyebrow, onClose, children }) {
  return <div className="admin-drawer-layer"><button className="admin-drawer-scrim" onClick={onClose} aria-label="Close media editor" /><aside className="admin-editor" role="dialog" aria-modal="true" aria-labelledby="asset-drawer-title"><header><div><small>{eyebrow}</small><h2 id="asset-drawer-title">{title}</h2></div><button onClick={onClose} aria-label="Close media editor"><X /></button></header>{children}</aside></div>
}
