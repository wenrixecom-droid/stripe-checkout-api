const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS — autorise ta boutique Shopify
  const origin = req.headers.origin || '';
  const allowed = (process.env.SHOP_DOMAIN || '').split(',').map(s => s.trim());
  if (allowed.some(d => origin.includes(d))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { name, image, amount, currency, quantity, success_url, cancel_url } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Montant invalide' });

    const product_data = { name: name || 'Commande' };
    if (image) product_data.images = [image];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: currency || 'eur',
          unit_amount: Math.round(amount),
          product_data
        },
        quantity: quantity || 1
      }],
      success_url: success_url || 'https://google.com',
      cancel_url: cancel_url || 'https://google.com'
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
