// Azure Functions entry point - registers all function handlers
import './functions/auth/register.js';
import './functions/auth/login.js';
import './functions/payment/create-order.js';
import './functions/payment/verify-payment.js';
import './functions/payment/webhook.js';
import './functions/usage/check-quota.js';
import './functions/usage/track-scan.js';
