const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const razorpay = require('../razorpayClient');

router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Razorpay error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * VERIFY PAYMENT
 */
router.post('/verify-payment', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return res.json({
  success: true,
  orderId: razorpay_order_id,
  paymentId: razorpay_payment_id,
});

    } else {
      return res.status(400).json({ success: false });
    }
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ success: false });
  }
});
module.exports = router;

