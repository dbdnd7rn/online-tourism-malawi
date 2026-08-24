const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
})

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing function configuration: ${name}`)
  return value
}

const asObject = (value: unknown): Record<string, unknown> | null => (
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
)

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return mismatch === 0
}

async function hmacSha256Hex(secret: string, value: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return bytesToHex(new Uint8Array(signature))
}

async function serviceRequest(path: string, init: RequestInit) {
  const url = requiredEnv('SUPABASE_URL')
  const serviceRole = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  return fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      ...(init.headers || {}),
    },
  })
}

async function authenticateVacEvent(request: Request, rawBody: string) {
  const expectedAppId = Deno.env.get('VAC_APP_ID')?.trim() || 'online-tourism'
  const appSecret = requiredEnv('VAC_APP_SECRET')
  const appId = (request.headers.get('x-vac-app-id') || '').trim()
  const timestampRaw = (request.headers.get('x-vac-timestamp') || '').trim()
  const nonce = (request.headers.get('x-vac-nonce') || '').trim().toLowerCase()
  const suppliedSignature = (request.headers.get('x-vac-signature') || '')
    .trim()
    .toLowerCase()
    .replace(/^sha256=/, '')

  if (appId !== expectedAppId) throw new Error('Unexpected VAC application id.')
  const timestamp = Number(timestampRaw)
  if (!Number.isInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) {
    throw new Error('VAC callback timestamp is invalid or expired.')
  }
  if (!/^[0-9a-f-]{36}$/.test(nonce)) throw new Error('VAC callback nonce is invalid.')
  if (!/^[0-9a-f]{64}$/.test(suppliedSignature)) throw new Error('VAC callback signature is invalid.')

  const canonical = [String(timestamp), nonce, 'POST', new URL(request.url).pathname, rawBody].join('.')
  const expectedSignature = await hmacSha256Hex(appSecret, canonical)
  if (!constantTimeEqual(expectedSignature, suppliedSignature)) throw new Error('VAC callback signature verification failed.')
  return appId
}

async function loadPaymentOrder(appPaymentId: string) {
  const response = await serviceRequest(
    `/rest/v1/subscription_payment_orders?app_payment_id=eq.${encodeURIComponent(appPaymentId)}&select=id,user_id,plan_id,app_payment_id,currency,amount_minor,status&limit=1`,
    { method: 'GET', headers: { Accept: 'application/json' } },
  )
  if (!response.ok) throw new Error('Unable to load the subscription payment order.')
  const rows = await response.json() as Array<Record<string, unknown>>
  if (!rows.length) throw new Error('Subscription payment order not found.')
  return rows[0]
}

async function recordEvent(idempotencyKey: string, appPaymentId: string, payload: Record<string, unknown>) {
  const response = await serviceRequest('/rest/v1/subscription_payment_events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      app_payment_id: appPaymentId,
      event_type: String(payload.event || 'payment.paid'),
      payload,
    }),
  })
  if (!response.ok) throw new Error('Unable to record the VAC payment event.')
}

async function activateSubscription(paymentOrderId: string, verifiedAt: string) {
  const response = await serviceRequest('/rest/v1/rpc/activate_subscription_from_verified_payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ p_payment_order_id: paymentOrderId, p_verified_at: verifiedAt }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Unable to activate the subscription.')
  }
  return response.json()
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ status: 'error', message: 'Method not allowed.' }, 405)

  try {
    const rawBody = await request.text()
    await authenticateVacEvent(request, rawBody)

    let payload: Record<string, unknown>
    try { payload = asObject(JSON.parse(rawBody)) || {} } catch { throw new Error('VAC callback body is not valid JSON.') }

    if (payload.event !== 'payment.paid') throw new Error('Unsupported VAC payment event.')
    if (payload.app_id !== (Deno.env.get('VAC_APP_ID')?.trim() || 'online-tourism')) throw new Error('VAC event app id does not match.')
    if (payload.purpose !== 'subscription') throw new Error('VAC payment purpose is not subscription.')

    const appPaymentId = typeof payload.app_payment_id === 'string' ? payload.app_payment_id.trim() : ''
    const appUserId = typeof payload.app_user_id === 'string' ? payload.app_user_id.trim() : ''
    const currency = typeof payload.currency === 'string' ? payload.currency.trim().toUpperCase() : ''
    const amountMinor = Number(payload.amount_minor ?? payload.amount_mwk)
    const idempotencyKey = (request.headers.get('x-vac-idempotency-key') || '').trim()
    const verifiedAt = typeof payload.verified_at === 'string' && payload.verified_at
      ? payload.verified_at
      : new Date().toISOString()

    if (!appPaymentId || !appUserId || !idempotencyKey) throw new Error('VAC callback identifiers are incomplete.')
    if (!['MWK', 'USD'].includes(currency)) throw new Error('VAC callback currency is unsupported.')
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error('VAC callback amount is invalid.')

    const order = await loadPaymentOrder(appPaymentId)
    if (String(order.user_id) !== appUserId) throw new Error('VAC callback user does not match the payment order.')
    if (String(order.currency).toUpperCase() !== currency) throw new Error('VAC callback currency does not match the payment order.')
    if (Number(order.amount_minor) !== amountMinor) throw new Error('VAC callback amount does not match the payment order.')

    await recordEvent(idempotencyKey, appPaymentId, payload)
    await activateSubscription(String(order.id), verifiedAt)

    return json({ status: 'accepted', fulfilled: true })
  } catch (error) {
    return json({
      status: 'error',
      fulfilled: false,
      message: error instanceof Error ? error.message : 'Unable to process VAC payment event.',
    }, 400)
  }
})
