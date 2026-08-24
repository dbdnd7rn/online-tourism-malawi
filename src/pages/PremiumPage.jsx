import { useMemo, useState } from 'react'
import { Check, Crown, ExternalLink, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { formatPlanPrice } from '../services/subscriptionService'

export default function PremiumPage() {
  const { user } = useAuth()
  const {
    plans,
    activeSubscription,
    isPremium,
    loading,
    error,
    beginCheckout,
  } = useSubscription()
  const [currency, setCurrency] = useState('USD')
  const [submitting, setSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const plan = useMemo(
    () => plans.find((item) => item.slug === 'premium-monthly') || plans[0] || null,
    [plans],
  )

  const expiry = activeSubscription?.expires_at
    ? new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(activeSubscription.expires_at))
    : ''

  const startCheckout = async () => {
    if (!plan || submitting) return
    setSubmitting(true)
    setCheckoutError('')
    try {
      await beginCheckout(plan.id, currency)
    } catch (reason) {
      setCheckoutError(reason instanceof Error ? reason.message : 'Unable to start checkout.')
      setSubmitting(false)
    }
  }

  return (
    <main className="premium-page">
      <section className="premium-shell">
        <Link className="premium-back" to="/media-library">← Back to media library</Link>

        <div className="premium-heading">
          <span className="premium-icon"><Crown size={30} /></span>
          <p>Online Tourism Premium</p>
          <h1>Unlock the complete cultural collection.</h1>
          <span>One membership gives access to Premium films, audio, galleries and digital cultural experiences for the full access period.</span>
        </div>

        {isPremium ? (
          <section className="premium-active-card">
            <Check size={28} />
            <div>
              <strong>Premium is active</strong>
              <p>Your current access remains active until {expiry}.</p>
              <button className="button button--gold" type="button" onClick={startCheckout} disabled={!plan || submitting}>
                {submitting ? 'Opening checkout…' : 'Renew Premium'}
              </button>
            </div>
          </section>
        ) : (
          <section className="premium-plan-card">
            <div className="premium-plan-card__top">
              <div>
                <small>Premium Monthly</small>
                <h2>{plan?.name || 'Premium Monthly'}</h2>
                <p>{plan?.description || 'Thirty days of Premium access.'}</p>
              </div>
              <span>{plan?.duration_days || 30} days</span>
            </div>

            <div className="premium-benefits">
              <span><Check size={18} /> Premium films and documentaries</span>
              <span><Check size={18} /> Premium audio and cultural collections</span>
              <span><Check size={18} /> Membership follows your signed-in account</span>
              <span><LockKeyhole size={18} /> Access activates only after verified payment</span>
            </div>

            <div className="premium-currency" role="group" aria-label="Choose payment currency">
              <button type="button" className={currency === 'USD' ? 'active' : ''} onClick={() => setCurrency('USD')}>
                <span>International</span><strong>USD</strong>
              </button>
              <button type="button" className={currency === 'MWK' ? 'active' : ''} onClick={() => setCurrency('MWK')}>
                <span>Malawi</span><strong>MWK</strong>
              </button>
            </div>

            <div className="premium-price">
              <strong>{plan ? formatPlanPrice(plan, currency) : loading ? 'Loading…' : 'Unavailable'}</strong>
              <span>for {plan?.duration_days || 30} days</span>
            </div>

            {error && <p className="premium-error">{error}</p>}
            {checkoutError && <p className="premium-error">{checkoutError}</p>}

            {user ? (
              <button className="button button--gold premium-checkout" type="button" onClick={startCheckout} disabled={!plan || loading || submitting}>
                {submitting ? 'Opening PayChangu…' : <>Continue to secure checkout <ExternalLink size={17} /></>}
              </button>
            ) : (
              <Link className="button button--gold premium-checkout" to="/sign-in">Sign in to continue</Link>
            )}

            <small className="premium-provider-note">Payment is completed securely on PayChangu Hosted Checkout. The website never handles card details.</small>
          </section>
        )}
      </section>
    </main>
  )
}
