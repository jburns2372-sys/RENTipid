# AWS EC2 / Lightsail Deployment Guide

This step-by-step guide covers the "Option A" deployment of RENTipid to a single Ubuntu server on AWS.

## A. Create AWS Server
1. Log into AWS Console.
2. Select **EC2** or **Lightsail**.
3. Choose **Ubuntu 22.04 LTS** or newer.
4. Allocate a **Static IP** to the instance.
5. Configure the Firewall / Security Group to open ports:
   - `22` (SSH - limit to your IP if possible)
   - `80` (HTTP)
   - `443` (HTTPS)

## B. Install Dependencies
SSH into the server and run:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git curl nginx certbot python3-certbot-nginx postgresql postgresql-contrib -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

## C. Clone Repository & Environment
```bash
git clone https://github.com/your-org/RENTipid.git
cd RENTipid
npm install

# Create production environment variables
nano .env.production
```
*Copy variables from `.env.production.example`. Ensure `PAYMENT_LIVE_MODE=false`.*

## D. Database Setup & Migration
1. Set up PostgreSQL user and database.
2. Ensure your `.env.production` has the correct `DATABASE_URL`.
3. Run migrations:
```bash
npx prisma generate
npx prisma migrate deploy
```
4. **Mandatory:** Run the database integrity check script to ensure core records are intact.

## E. Build and Run
```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## F. Reverse Proxy (Nginx)
1. Copy the `docs/nginx-rentipid.conf` to `/etc/nginx/sites-available/rentipid`.
2. Edit the file and replace `your-production-domain.com` with your actual domain.
3. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/rentipid /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## G. HTTPS Configuration
1. Ensure your Domain DNS A Record points to the AWS Static IP.
2. Run Certbot to install the SSL certificate:
```bash
sudo certbot --nginx -d your-production-domain.com -d www.your-production-domain.com
```

## H. Verification
Verify the following URLs are reachable via HTTPS:
- `https://your-production-domain.com/`
- `https://your-production-domain.com/login`
- `https://your-production-domain.com/dashboard/super-admin/production-domain-readiness`
- `https://your-production-domain.com/dashboard/super-admin/live-payment-execution`
- `https://your-production-domain.com/api/webhooks/paymongo/health`
