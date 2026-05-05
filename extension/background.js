// Background service worker: required for ExtensionPay to listen for payment events.
importScripts("ExtPay.js");

// IMPORTANT: replace "color-picker-pro" below with your actual ExtensionPay
// extension ID (the one you create at https://extensionpay.com/).
const extpay = ExtPay("color-picker-pro");
extpay.startBackground();
