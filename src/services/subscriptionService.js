import { supabase } from '../lib/supabase'

const requireSupabase = () => {
  if (!supabase) throw new Error('Connect Supabase to use Premium subscriptions.')
  return supabase
}

export async function loadSubscriptionPlans() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('subscription_plans')
    .select('id, slug, name, description, duration_days, price_mwk, price_usd_cents, active, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function loadMySubscriptions(userId) {
  if (!userId) return []
  const client = requireSupabase()
  const { data, error } = await client
    .from('user_subscriptions')
    .select('id, user_id, plan_id, status, starts_at, expires_at, latest_payment_order_id, created_at, updated_at, subscription_plans(id, slug, name, duration_days, active)')
    .eq('user_id', userId)
    .order('expires_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function loadMyPaymentOrders(userId, limit = 20) {
  if (!userId) return []
  const client = requireSupabase()
  const { data, error } = await client
    .from('subscription_payment_orders')
    .select('id, plan_id, app_payment_id, vac_payment_intent_id, merchant_reference, currency, amount_minor, status, checkout_url, paid_at, verified_at, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function createSubscriptionCheckout(planId, currency) {
  const client = requireSupabase()
  const normalizedCurrency = String(currency || '').trim().toUpperCase()
  if (!['MWK', 'USD'].includes(normalizedCurrency)) throw new Error('Choose MWK or USD.')

  const { data, error } = await client.functions.invoke('create-subscription-payment', {
    body: { planId, currency: normalizedCurrency },
  })
  if (error) throw error
  if (!data?.checkout_url) throw new Error(data?.message || 'The hosted checkout URL was not returned.')
  return data
}

export function formatPlanPrice(plan, currency) {
  if (!plan) return ''
  if (currency === 'USD') return `$${(Number(plan.price_usd_cents || 0) / 100).toFixed(2)}`
  return `MWK ${Number(plan.price_mwk || 0).toLocaleString('en-MW')}`
}
