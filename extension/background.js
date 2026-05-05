// Background service worker: required for ExtensionPay to listen for payment events.
importScripts("ExtPay.js");

// IMPORTANT: replace "color-pick-pal" below with your actual ExtensionPay
// extension ID (the one you create at https://extensionpay.com/).
const extpay = ExtPay("color-pick-pal");
extpay.startBackground();
