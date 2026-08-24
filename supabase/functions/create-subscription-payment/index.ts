const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
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

async function supabaseRequest(path: string, init: RequestInit, serviceRole = true) {
  const url = requiredEnv('SUPABASE_URL')
  const key = requiredEnv(serviceRole ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_ANON_KEY')
  return fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: serviceRole ? `Bearer ${key}` : String((init.headers as Record<string, string> | undefined)?.Authorization || ''),
      ...(init.headers || {}),
    },
  })
}

async function readAuthenticatedUser(request: Request) {
  const authorization = request.headers.get('Authorization') || ''
  if (!authorization.toLowerCase().startsWith('bearer ')) throw new Error('Sign in before starting checkout.')

  const response = await supabaseRequest('/auth/v1/user', {
    method: 'GET',
    headers: { Authorization: authorization },
  }, false)

  if (!response.ok) throw new Error('Your session is invalid or expired.')
  const user = await response.json() as { id?: string; email?: string }
  if (!user.id || !user.email) throw new Error('A verified account email is required for checkout.')
  return user as { id: string; email: string }
}

async function loadPlan(planId: string) {
  const response = await supabaseRequest(
    `/rest/v1/subscription_plans?id=eq.${encodeURIComponent(planId)}&active=eq.true&select=id,slug,name,description,duration_days,price_mwk,price_usd_cents&limit=1`,
    { method: 'GET', headers: { Accept: 'application/json' } },
  )
  if (!response.ok) throw new Error('Unable to load the subscription plan.')
  const rows = await response.json() as Array<Record<string, unknown>>
  if (!rows.length) throw new Error('This subscription plan is unavailable.')
  return rows[0]
}

async function insertPaymentOrder(order: Record<string, unknown>) {
  const response = await supabaseRequest('/rest/v1/subscription_payment_orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(order),
  })
  if (!response.ok) throw new Error('Unable to create the subscription payment order.')
  const rows = await response.json() as Array<Record<string, unknown>>
  if (!rows[0]?.id) throw new Error('Subscription payment order was not returned.')
  return rows[0]
}

async function updatePaymentOrder(id: string, patch: Record<string, unknown>) {
  const response = await supabaseRequest(`/rest/v1/subscription_payment_orders?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  })
  if (!response.ok) throw new Error('Unable to update the subscription payment order.')
}

async function createVacPaymentIntent(payload: Record<string, unknown>) {
  const base = new URL(requiredEnv('VAC_PAYMENTS_URL'))
  const endpoint = new URL('/v1/payment-intents', base)
  const appId = Deno.env.get('VAC_APP_ID')?.trim() || 'online-tourism'
  const appSecret = requiredEnv('VAC_APP_SECRET')
  const rawBody = JSON.stringify(payload)
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomUUID().toLowerCase()
  const canonical = [String(timestamp), nonce, 'POST', endpoint.pathname, rawBody].join('.')
  const signature = await hmacSha256Hex(appSecret, canonical)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-vac-app-id': appId,
      'x-vac-timestamp': String(timestamp),
      'x-vac-nonce': nonce,
      'x-vac-signature': signature,
    },
    body: rawBody,
  })

  const text = await response.text()
  let data: Record<string, unknown> = {}
  try { data = asObject(JSON.parse(text)) || {} } catch { data = {} }
  if (!response.ok) {
    throw new Error(String(data.message || 'VAC Payments could not create the hosted checkout.'))
  }
  return data
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ status: 'error', message: 'Method not allowed.' }, 405)

  let paymentOrderId: string | null = null
  try {
    const user = await readAuthenticatedUser(request)
    const body = asObject(await request.json())
    const planId = typeof body?.planId === 'string' ? body.planId.trim() : ''
    const currency = typeof body?.currency === 'string' ? body.currency.trim().toUpperCase() : ''
    if (!planId) return json({ status: 'error', message: 'planId is required.' }, 400)
    if (currency !== 'MWK' && currency !== 'USD') {
      return json({ status: 'error', message: 'currency must be MWK or USD.' }, 400)
    }

    const plan = await loadPlan(planId)
    const amountMinor = currency === 'USD'
      ? Number(plan.price_usd_cents)
      : Number(plan.price_mwk)
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      throw new Error('The subscription plan has an invalid server-side price.')
    }

    const appPaymentId = `tourism_sub_${crypto.randomUUID()}`
    const order = await insertPaymentOrder({
      user_id: user.id,
      plan_id: planId,
      app_payment_id: appPaymentId,
      currency,
      amount_minor: amountMinor,
      status: 'pending',
    })
    paymentOrderId = String(order.id)

    const vac = await createVacPaymentIntent({
      appPaymentId,
      appUserId: user.id,
      purpose: 'subscription',
      method: 'hosted_checkout',
      amountMinor,
      currency,
      customerEmail: user.email.toLowerCase(),
      title: String(plan.name || 'Premium membership'),
      description: `${Number(plan.duration_days || 30)} days of Premium Online Tourism access`,
      metadata: {
        subscription_order_id: paymentOrderId,
        plan_id: planId,
        plan_slug: plan.slug,
      },
    })

    const intent = asObject(vac.payment_intent)
    const checkoutUrl = typeof intent?.checkout_url === 'string' ? intent.checkout_url : ''
    const vacIntentId = typeof intent?.id === 'string' ? intent.id : null
    const merchantReference = typeof intent?.merchant_reference === 'string' ? intent.merchant_reference : null
    if (!checkoutUrl) throw new Error('VAC Payments did not return the PayChangu hosted checkout URL.')

    await updatePaymentOrder(paymentOrderId, {
      vac_payment_intent_id: vacIntentId,
      merchant_reference: merchantReference,
      checkout_url: checkoutUrl,
      status: 'pending',
    })

    return json({
      status: 'success',
      checkout_url: checkoutUrl,
      payment_order_id: paymentOrderId,
      app_payment_id: appPaymentId,
      currency,
      amount_minor: amountMinor,
    }, 201)
  } catch (error) {
    if (paymentOrderId) {
      try { await updatePaymentOrder(paymentOrderId, { status: 'failed' }) } catch { /* keep original error */ }
    }
    return json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to start subscription checkout.',
    }, 400)
  }
})
