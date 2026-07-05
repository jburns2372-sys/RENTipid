# AWS Security Hardening Checklist

Before executing the live payment pilot on AWS, the following security measures MUST be verified:

## Server Access
- [ ] **SSH Key Authentication:** Ensure root or ubuntu user is accessed ONLY via an SSH key (`.pem` or `.pub` file).
- [ ] **Disable Password Authentication:** In `/etc/ssh/sshd_config`, set `PasswordAuthentication no`.
- [ ] **Firewall Restricted:** Only ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) are open on the AWS Security Group.

## Application Security
- [ ] **Secrets Not Committed:** Verified that `.env.production` is strictly local to the server and not in GitHub.
- [ ] **HTTPS Enforced:** Nginx forces all traffic to HTTPS via port 443.
- [ ] **Private Files Protected:** `/private-uploads` is not statically served by Nginx.

## Feature Gate Hardening (Phase 19B)
- [ ] **Live Payment Blocked by Default:** `PAYMONGO_LIVE_ENABLED=false` until explicitly allowed by Super Admin.
- [ ] **Automated Refunds OFF:** Code execution requires manual review.
- [ ] **Automated Payouts OFF:** Code execution requires manual review.
- [ ] **Real Social Posting OFF:** API integrations to external social platforms are disabled.

## Data Security
- [ ] **Database Not Publicly Accessible:** PostgreSQL port `5432` is strictly bound to `localhost` or restricted by AWS Security Groups.
- [ ] **Regular Backups Enabled:** Database and files are backed up daily.
- [ ] **Audit Logs Active:** Critical operations write to `SystemLog`.
