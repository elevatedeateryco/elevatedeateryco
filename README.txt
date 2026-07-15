Open index.html to preview. This is the catering-first revision.

DYNAMIC ORDERING UPGRADE
------------------------
The site now includes:
- Six pricing plan choices
- Pickup or delivery selection
- ZIP-based $50/$75 delivery fee selection
- Quantities for all 10 Signature Bowls
- An 11th Make Your Own Bowl option
- A separate customization modal for every custom bowl
- Minimum validation for 10+ and 25+ plans
- Live cart and order review
- Secure Square checkout handoff

To activate payments:
1. Deploy square-checkout-worker.js as a Cloudflare Worker.
2. Add Worker secrets SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID.
3. Set SQUARE_ENVIRONMENT to sandbox for testing, then production.
4. Add the Worker URL to squareCheckoutEndpoint in config.js.

FINAL ORDERING POLISH
---------------------
- Removed the duplicate legacy Build Your Own Bowl section.
- Added Regular/Halal preparation selection to every individually customized bowl.
- Custom bowl price now follows the selected quantity tier and its own preparation choice.
