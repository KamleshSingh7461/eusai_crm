# ID card verification addresses

Each company's ID cards carry a QR code that opens `https://verify.<company domain>/v/<code>`, for example
`https://verify.fgsnlive.com/v/…`. Anyone can open it without signing in. This guide is the one-time setup per
company, done after the release containing the `20261115090000_verification_log` migration is live.

## How it works

- The CRM server answers on the company's `verify.` address as well as its own address.
- On any address that starts with `verify.`, the app serves **only** the verification pages
  (`/` for typing a card number, `/v/<code>` for a scanned QR). Every CRM page and API returns 404 there.
- A `verify.` address only answers for its own company's cards. On the CRM's own address,
  `/verify` works for every company (useful before a company's address is set up).
- Pages are marked `noindex`, lookups are rate limited (typed card numbers: 10 per 10 minutes per visitor;
  QR links: 60 per minute), and every check is logged (visitor IP stored only as a salted hash).

## Per company: four steps

1. **Domain record** (whoever manages the company's domain, e.g. GoDaddy or Route 53):
   - Load balancer in front of the app: add a `CNAME` record `verify` → the load balancer's DNS name.
   - Otherwise: add an `A` record `verify` → the server's public IP (the same target as the CRM's own record).

   Nothing else on the company's domain changes; the main website and email are untouched.

2. **HTTPS certificate** for `verify.<domain>`, on whatever terminates HTTPS for the CRM today:
   - AWS load balancer: request the certificate in ACM (DNS validation adds one more record), then add it to the
     HTTPS listener. Renews automatically.
   - nginx on the server: add `verify.<domain>` to the CRM's `server_name` and run
     `sudo certbot --nginx -d verify.<domain>`. Renews automatically.

3. **Proxy headers.** The app needs the original address and visitor IP. nginx must pass:
   ```
   proxy_set_header Host $host;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   ```
   (An AWS load balancer does both by default.)

4. **In the CRM**, a Director opens Companies → the company → Sign-in and verification → Verification address,
   enters `verify.<domain>` and saves. It must start with `verify.`.

Check it: open `https://verify.<domain>/` on a phone. The "Employee ID verification" page should load, and
`https://verify.<domain>/login` should say "Not found".

## Keep it working

- Cards already printed contain this address. Keep the domain renewed and the record in place for as long as
  those cards exist (their validity is set per company: 1, 2, 3 or 5 years).
- If an address ever has to change, keep the old one pointing at the CRM too, so old cards still verify.

## Local testing

`http://verify.localhost:3000` behaves like a company's verification address (browsers send `*.localhost` to
your own machine), and in local development it answers for every company's cards.
