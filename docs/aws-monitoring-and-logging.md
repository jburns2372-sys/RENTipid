# AWS Monitoring and Logging Plan

## 1. PM2 Application Logs
PM2 automatically manages Node.js logs.
- **Location:** Defined in `ecosystem.config.js` (`./logs/out.log` and `./logs/err.log`).
- **Command to view real-time logs:**
  ```bash
  pm2 logs rentipid
  ```
- **Command to monitor memory and CPU:**
  ```bash
  pm2 monit
  ```

## 2. Nginx Logs
Nginx logs access and errors, useful for tracking webhook delivery from PayMongo.
- **Access Log:** `/var/log/nginx/access.log`
- **Error Log:** `/var/log/nginx/error.log`
- **View live requests:**
  ```bash
  tail -f /var/log/nginx/access.log
  ```

## 3. Database Logs (SystemLog Table)
RENTipid internally logs critical application events to the `SystemLog` database table.
- Viewable via the Super Admin Dashboard: `/dashboard/super-admin/aws-operations-monitor`
- Tracked categories: `webhook`, `payment`, `auth`, `error`.

## 4. PayMongo Webhook Logs
PayMongo provides a developer dashboard to view specific webhook delivery attempts and payloads.
- If PayMongo shows "Failed", cross-reference the exact timestamp with `/var/log/nginx/access.log` to determine if the server rejected the connection or if the Next.js app failed to process it.
