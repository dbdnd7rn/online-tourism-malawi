/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  createSubscriptionCheckout,
  loadMyPaymentOrders,
  loadMySubscriptions,
  loadSubscriptionPlans,
} from '../services/subscriptionService'

const SubscriptionContext = createContext(null)

export function SubscriptionProvider({ children }) {
  const { user, previewMode } = useAuth()
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [paymentOrders, setPaymentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (previewMode) {
      setPlans([])
      setSubscriptions([])
      setPaymentOrders([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const [nextPlans, nextSubscriptions, nextOrders] = await Promise.all([
        loadSubscriptionPlans(),
        user ? loadMySubscriptions(user.id) : Promise.resolve([]),
        user ? loadMyPaymentOrders(user.id) : Promise.resolve([]),
      ])
      setPlans(nextPlans)
      setSubscriptions(nextSubscriptions)
      setPaymentOrders(nextOrders)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load Premium membership.')
    } finally {
      setLoading(false)
    }
  }, [previewMode, user])

  useEffect(() => { refresh() }, [refresh])

  const activeSubscription = useMemo(() => {
    const now = Date.now()
    return subscriptions.find((subscription) => (
      subscription.status === 'active'
      && new Date(subscription.starts_at).getTime() <= now
      && new Date(subscription.expires_at).getTime() > now
      && subscription.subscription_plans?.active !== false
    )) || null
  }, [subscriptions])

  const value = useMemo(() => ({
    plans,
    subscriptions,
    paymentOrders,
    activeSubscription,
    isPremium: Boolean(activeSubscription),
    loading,
    error,
    refresh,
    async beginCheckout(planId, currency) {
      if (!user) throw new Error('Sign in before starting Premium checkout.')
      if (previewMode) throw new Error('Payments are disabled in preview mode.')
      const checkout = await createSubscriptionCheckout(planId, currency)
      if (checkout.checkout_url) window.location.assign(checkout.checkout_url)
      return checkout
    },
  }), [plans, subscriptions, paymentOrders, activeSubscription, loading, error, refresh, user, previewMode])

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  const value = useContext(SubscriptionContext)
  if (!value) throw new Error('useSubscription must be used inside SubscriptionProvider')
  return value
}
