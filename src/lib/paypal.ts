// PayPal Integration - LIVE MODE
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID
const PAYPAL_SECRET = import.meta.env.PAYPAL_CLIENT_SECRET
const PAYPAL_MODE = import.meta.env.VITE_PAYPAL_MODE || 'live'

// Use Live API endpoint
const PAYPAL_API_BASE = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

console.log(`🔵 PayPal Mode: ${PAYPAL_MODE.toUpperCase()}`)
console.log(`🔵 PayPal API Base: ${PAYPAL_API_BASE}`)

// Get PayPal Access Token
export async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error('PayPal credentials are not configured')
  }

  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)

  try {
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('PayPal token error:', error)
      throw new Error(`PayPal authentication failed: ${error.error_description}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('PayPal token request failed:', error)
    throw error
  }
}

// Create PayPal Order
export async function createPayPalOrder(amount: number, description: string): Promise<string | null> {
  try {
    const accessToken = await getPayPalAccessToken()

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
          description: description,
        }],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('PayPal order creation error:', error)
      return null
    }

    const data = await response.json()
    return data.id
  } catch (error) {
    console.error('PayPal order creation failed:', error)
    return null
  }
}

// Capture PayPal Order
export async function capturePayPalOrder(orderId: string): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken()

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('PayPal capture error:', error)
      return false
    }

    const data = await response.json()
    return data.status === 'COMPLETED'
  } catch (error) {
    console.error('PayPal capture failed:', error)
    return false
  }
}

// Create Withdrawal Request (Payout)
export async function createWithdrawal(
  userId: string,
  paypalEmail: string,
  amount: number
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    if (!paypalEmail || amount <= 0) {
      return { success: false, error: 'Invalid PayPal email or amount' }
    }

    const accessToken = await getPayPalAccessToken()

    const response = await fetch(`${PAYPAL_API_BASE}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: `batch_${userId}_${Date.now()}`,
          email_subject: 'You received a payment from ReferralChain!',
          email_message: 'Thank you for your earnings with ReferralChain',
        },
        items: [{
          recipient_type: 'EMAIL',
          amount: {
            value: amount.toFixed(2),
            currency: 'USD',
          },
          receiver: paypalEmail,
          note: 'ReferralChain Commission Withdrawal',
          sender_item_id: `item_${userId}_${Date.now()}`,
        }],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('PayPal payout error:', error)
      return { success: false, error: error.message || 'Payout failed' }
    }

    const data = await response.json()

    if (data.batch_header?.payout_batch_id) {
      console.log(`✅ Payout successful: ${data.batch_header.payout_batch_id}`)
      return {
        success: true,
        transactionId: data.batch_header.payout_batch_id,
      }
    }

    return { success: false, error: 'Payout batch ID not returned' }
  } catch (error) {
    console.error('PayPal withdrawal failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Network error' }
  }
}

// Get PayPal SDK Script URL
export function getPayPalSDKUrl(): string {
  return `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`
}

// Verify Webhook (for future use)
export async function verifyPayPalWebhook(
  webhookId: string,
  transmissionId: string,
  transmissionTime: string,
  certUrl: string,
  authAlgo: string,
  transmissionSig: string,
  webhookBody: string
): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken()

    const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_body: webhookBody,
      }),
    })

    const data = await response.json()
    return data.verification_status === 'SUCCESS'
  } catch (error) {
    console.error('PayPal webhook verification failed:', error)
    return false
  }
}
