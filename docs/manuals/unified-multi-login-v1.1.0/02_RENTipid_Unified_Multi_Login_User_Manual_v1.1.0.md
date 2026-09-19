# RENTipid Unified Multi-Login Authentication Module

## User Manual v1.1.0

**Document status:** CLOSED / VERSION FROZEN  
**For:** RENTipid renters, providers, business users and account holders  
**Production site:** <https://www.rentipid.com.ph>  
**Prepared:** 2026-09-19

> **IMPORTANT:** RENTipid support should never ask for your password, WhatsApp code, OAuth code, session cookie or provider secret. Do not send these values to anyone.

## Table of Contents

1. [Getting started](#1-getting-started)
2. [Opening RENTipid](#2-opening-rentipid)
3. [Sign in or create an account](#3-sign-in-or-create-an-account)
4. [Continue with Google](#4-continue-with-google)
5. [Continue with Facebook](#5-continue-with-facebook)
6. [Continue with Apple](#6-continue-with-apple)
7. [Continue with WhatsApp OTP](#7-continue-with-whatsapp-otp)
8. [Email and password](#8-email-and-password)
9. [First-time user registration](#9-first-time-user-registration)
10. [Returning user login](#10-returning-user-login)
11. [Account Security](#11-account-security)
12. [Connected Login Methods](#12-connected-login-methods)
13. [Connecting another login method](#13-connecting-another-login-method)
14. [Disconnecting a login method](#14-disconnecting-a-login-method)
15. [Why RENTipid may prevent disconnect](#15-why-rentipid-may-prevent-disconnect)
16. [Using multiple methods for one account](#16-using-multiple-methods-for-one-account)
17. [What happens when emails match](#17-what-happens-when-emails-match)
18. [Sign-in method not connected](#18-sign-in-method-not-connected)
19. [AccountLinkRequired in plain language](#19-accountlinkrequired-in-plain-language)
20. [Recovering access](#20-recovering-access)
21. [Logging out](#21-logging-out)
22. [Session security](#22-session-security)
23. [Protecting your account](#23-protecting-your-account)
24. [Privacy considerations](#24-privacy-considerations)
25. [Apple Hide My Email](#25-apple-hide-my-email)
26. [Facebook email availability](#26-facebook-email-availability)
27. [Google sign-in](#27-google-sign-in)
28. [WhatsApp OTP safety](#28-whatsapp-otp-safety)
29. [Email/password safety](#29-emailpassword-safety)
30. [Common login problems](#30-common-login-problems)
31. [User FAQ](#31-user-faq)

## 1. Getting started

RENTipid lets you choose from five sign-in methods:

1. Email and password
2. WhatsApp mobile one-time code
3. Google
4. Facebook
5. Apple

You can connect more than one method to the same RENTipid account. This does not create five copies of your account. Your permanent RENTipid user identity owns your profile, role, verification/KYC state, listings, bookings, payments, ledger history, reviews and security history. A login method is only a way to prove that you may enter that account.

> **NOTE:** Public SMS login is not part of v1.1.0. The mobile-code option is WhatsApp OTP.

## 2. Opening RENTipid

1. Open a current browser on your phone, tablet or computer.
2. Enter `https://www.rentipid.com.ph` yourself or use a trusted bookmark.
3. Check that the address begins with `https://www.rentipid.com.ph`.
4. Select **Login**.

What you should see:

![Public RENTipid sign-in page showing Google, Facebook, Apple, WhatsApp and email options. No user data is shown.](images/unified-login-page.png)

**Figure 1.** Public Production sign-in gateway captured without a signed-in session.

> **WARNING:** Do not enter credentials after following an unexpected message link if the domain is different, misspelled or not protected by HTTPS.

## 3. Sign in or create an account

The page title is **Sign in or create an account**. Existing users and new users begin on the same gateway.

1. Choose the method you want to use.
2. Review the Terms of Service and Privacy Policy links.
3. Complete the provider, WhatsApp or email steps.
4. If you are new, RENTipid may create an account under the public onboarding rules.
5. If the identity is already connected, RENTipid opens the same existing account.

> **TIP:** Returning users should choose a method they have already used or connected. If you want to add a new provider, first sign in, then use Account Security.

## 4. Continue with Google

### What to click

1. Select **Continue with Google**.
2. If prompted, accept RENTipid's current terms and privacy notice before leaving the site.
3. At Google, choose the Google account you control.
4. Review Google's consent screen and continue.
5. The browser returns to RENTipid.

### What happens next

- If this Google identity is connected, you enter the same RENTipid account as before.
- If it is completely new and no existing-account match requires linking, RENTipid may create a new account.
- If RENTipid finds a possible existing account with the same email, it stops and asks you to link explicitly. See [Section 19](#19-accountlinkrequired-in-plain-language).

### If it fails

Return to the RENTipid login page and try once more. Confirm you are using the intended Google account. If the message says the method is not connected, do not keep creating accounts; sign in with an existing method and connect Google from Account Security.

## 5. Continue with Facebook

1. Select **Continue with Facebook**.
2. Accept RENTipid's current terms/privacy prompt when shown.
3. Sign in to Facebook through Facebook's own page.
4. Review the requested information and continue.
5. Wait for the browser to return to RENTipid.

Facebook may not provide an email address. That does not make the Facebook identity invalid. RENTipid uses Facebook's durable provider ID for account resolution.

> **IMPORTANT:** If RENTipid says the Facebook identity is already in use, stop and contact support. This is an ownership protection. Do not ask support to move it based only on a matching name or email.

## 6. Continue with Apple

1. Select **Continue with Apple**.
2. Accept the current RENTipid terms/privacy prompt when shown.
3. Authenticate on Apple's page.
4. Choose whether to share your email or use **Hide My Email**, if Apple offers the choice.
5. Approve the sign-in.
6. Apple returns the browser to RENTipid.

Apple uses a secure cross-site return to RENTipid. If the callback fails, restart from the RENTipid login page in a normal browser. Avoid copying callback links between browsers.

> **NOTE:** Apple can provide your name only on the first authorization. RENTipid does not depend on Apple repeating it every time.

## 7. Continue with WhatsApp OTP

1. Select **Continue with WhatsApp**.
2. Enter your mobile number with the correct country code.
3. Select the button to request a code.
4. Open the WhatsApp message from the configured verification service.
5. Return to RENTipid and enter the code.
6. Submit it before it expires.

The implemented default is a five-minute challenge with up to five verification attempts. The same completed challenge cannot be reused.

> **TIP:** Request one code, wait for it and use the newest active challenge. Repeated requests can trigger a short cooldown or rate limit.

> **WARNING:** Never give the code to a caller, chat agent or person claiming to “verify” your account. Anyone with the live code may be trying to sign in as you.

## 8. Email and password

### Sign in

1. Enter the email used for your RENTipid email credential.
2. Select **Continue with Email**.
3. Enter your password when prompted.
4. Complete email verification first if RENTipid says it is required.

### Password rules

The frozen v1.1.0 validation accepts 8 to 128 characters and rejects null characters. Use a unique, long password that you do not use on other sites. A password manager can create and store one safely.

### If the password is forgotten

Use the password-recovery link. The response is deliberately generic, whether or not an account exists. A reset link expires after 30 minutes and works once. After a successful reset, all RENTipid sessions are signed out.

## 9. First-time user registration

Email registration may ask you to choose an allowed public account type and enter profile information.

1. Select **Create an account**.
2. Choose the appropriate public account type: renter, individual provider or business provider.
3. Enter accurate required information.
4. Create a unique password.
5. Review and accept the Terms of Service and Privacy Policy.
6. Submit the registration.
7. Open the email verification message and complete verification.
8. Return to RENTipid and sign in.

External sign-in providers do not make you an administrator, operator or staff member. RENTipid controls those roles internally.

## 10. Returning user login

1. Open the official sign-in page.
2. Choose a method already connected to your account.
3. Complete that provider's proof.
4. RENTipid resolves the provider identity to your permanent user ID.
5. Your profile and marketplace records load under the same account.

If Google is connected today and Apple is connected later, either can lead to the same account. Your provider choice does not create a new set of bookings or KYC information.

## 11. Account Security

After signing in:

1. Open **Dashboard**.
2. Choose **Account Security**. In some navigation paths, the security area appears within the Profile dashboard.
3. Review MFA, active sessions and **Connected Login Methods** as available.

Account Security is the correct place to add a provider to an existing account. Starting with a new provider from the public login page is not the same as explicitly connecting it.

## 12. Connected Login Methods

The panel lists:

- Google
- Facebook
- Apple
- Email & Password
- WhatsApp OTP

Possible states include:

| Status | Meaning |
|---|---|
| **Connected** | This method belongs to the current RENTipid account and can be used when enabled |
| **Not connected** | The method is not yet linked to this account |
| **Unavailable in Preview** or unavailable | The environment does not currently expose that method; this wording is an availability state, not evidence of disconnection |

The panel may show a safe display email or masked/connected phone information. It must never show RENTipid's internal synthetic identity email as if it were your contact email.

## 13. Connecting another login method

Use this flow for Google, Facebook or Apple:

1. Sign in to the RENTipid account you want to keep.
2. Open **Dashboard > Account Security > Connected Login Methods**.
3. Find a method marked **Not connected**.
4. Select **Connect Google**, **Connect Facebook** or **Connect Apple**.
5. Complete the external provider sign-in.
6. Return to RENTipid.
7. Confirm the method now says **Connected**.
8. On a separate future visit, test the new method while you still have the original recovery option.

Behind the screen, RENTipid creates a short-lived instruction bound to your current user and selected provider. This prevents an ordinary sign-in from silently becoming a link.

> **IMPORTANT:** Make sure the external provider account is yours before approving. If a shared device shows someone else's Google/Facebook/Apple account, cancel and sign out of that provider first.

## 14. Disconnecting a login method

1. Sign in using a trusted method.
2. Open **Connected Login Methods**.
3. Confirm another usable method is connected and tested.
4. Select **Disconnect** beside the provider you want to remove.
5. Read the confirmation carefully.
6. Confirm the removal.
7. Verify the status changes to **Not connected**.

Disconnecting removes that provider as an entry method. It does not delete the external Google, Facebook or Apple account and does not delete your RENTipid marketplace data.

## 15. Why RENTipid may prevent disconnect

RENTipid blocks removal of your last usable sign-in method. Otherwise, you could lock yourself out immediately.

If removal is blocked:

1. Connect another method.
2. Verify that the connection completed.
3. Sign out and test the alternate method if practical.
4. Sign back in and disconnect the old method.

Do not ask support to delete the final identity directly from the database. That would bypass the protection and could leave the account unreachable.

## 16. Using multiple methods for one account

Think of the relationship this way:

```text
Permanent RENTipid user U123
  - Google identity
  - Apple identity
  - Facebook identity
  - Email/password credential
  - WhatsApp phone identity
```

All connected methods can resolve to U123. The account's role, permissions, verification, profiles, listings, bookings, payments, ledger entries, reviews and history remain with U123.

You do not need to connect every method. Connect only providers you control and want as sign-in options.

## 17. What happens when emails match

Suppose your existing RENTipid account uses Google with `name@example.com`, and you later choose Apple, which reports the same address.

RENTipid does **not** assume the accounts are the same. Email addresses can be recycled, mistyped, hidden, changed or reported differently by providers. An attacker may also control a separate provider account that claims a familiar email.

RENTipid therefore stops and asks for explicit linking. This is expected security behavior.

## 18. Sign-in method not connected

The login page may say:

> Sign-in method not connected. Sign in using one of your existing methods, then connect the new method from Account Security.

Follow these steps:

1. Return to the login page.
2. Choose the method you have successfully used before.
3. Sign in to your existing RENTipid account.
4. Open Account Security.
5. Select Connect for the new provider.
6. Authenticate the new provider.
7. Confirm it shows Connected.

If you no longer control any connected method, use the appropriate recovery flow or contact support. Do not create repeated new accounts.

## 19. AccountLinkRequired in plain language

`AccountLinkRequired` means two things happened:

1. The external provider successfully proved that you control that provider identity.
2. RENTipid still needs proof that you control the existing RENTipid account before joining them.

This is similar to needing two keys: one for the existing RENTipid account and one for the new provider. After both are proven through the explicit Connect flow, either provider can open the same account.

It is not a password failure, and it does not mean the provider is broken. It is an account-takeover safeguard.

## 20. Recovering access

### If you have another connected method

Use it. Then open Account Security, review connected methods and repair or replace the unavailable one.

### If you forgot an email password

1. Select password recovery.
2. Enter your email.
3. Check inbox and spam folders.
4. Open the newest reset link within 30 minutes.
5. Choose a unique password.
6. Sign in again; previous sessions have been revoked.

### If you lost the phone

Use Google, Facebook, Apple or email/password if already connected. Protect the WhatsApp account and SIM through the relevant providers. After regaining RENTipid access, review connected methods and active sessions.

### If you lost an OAuth provider account

Use another connected method. Recover the external provider through that provider's official recovery process. RENTipid cannot reset a Google, Facebook or Apple credential.

### If no method works

Contact RENTipid support through the official site. Be ready to provide non-secret account and transaction context under the approved support process. Never send a password, OTP or cookie.

## 21. Logging out

1. Open your account menu.
2. Select **Log out**.
3. Wait for RENTipid to return to a signed-out page.
4. On a shared device, also sign out of Google/Facebook/Apple if you signed into those services there.

Normal RENTipid logout revokes the current server session and clears its stronger-session assurance. Closing a tab alone may not log you out.

## 22. Session security

RENTipid maintains a server session registry so a session can be revoked. Account Security may let you view active sessions, revoke another session or log out other sessions.

If you see a session you do not recognize:

1. Revoke the unknown session or log out other sessions.
2. Change the established password if your email credential may be affected.
3. Secure the connected external provider accounts.
4. Review connected methods.
5. Contact support if you see an unauthorized link or unlink.

Password reset signs out every registered RENTipid session.

## 23. Protecting your account

- Connect at least two methods you control when practical.
- Use a password manager and a unique password.
- Protect the email and phone accounts that receive recovery messages.
- Enable RENTipid MFA when available for your account.
- Store MFA recovery codes offline and private.
- Review active sessions and Connected Login Methods.
- Remove a provider you no longer control, but only after connecting another method.
- Do not approve unexpected provider consent screens.
- Report unauthorized link/unlink activity immediately.

## 24. Privacy considerations

Different methods disclose different metadata to RENTipid. Google and Apple may provide verified email metadata; Facebook may not. Apple can provide a relay address. WhatsApp login uses a verified mobile number. Email/password uses the email you register.

RENTipid keeps durable provider identity separate from email metadata. This reduces the need to treat a changeable email as permanent identity. Authentication data is still sensitive: share it only through official, access-controlled processes.

## 25. Apple Hide My Email

If you choose Hide My Email, Apple provides a private relay address. RENTipid records that it is private metadata and links the account through Apple's stable subject identifier.

- Keep forwarding enabled at Apple if you expect messages through the relay.
- Do not try to replace the relay address merely to “make login match.”
- If the Apple subject is connected, returning Apple sign-in should reach the same RENTipid account even when email presentation changes.

## 26. Facebook email availability

Facebook may return no email. RENTipid can still use the Facebook subject for a connected login. Your RENTipid contact/profile information is separate. If you need an email/password method, add it through an approved credential flow; a Facebook email must not silently become a password credential.

## 27. Google sign-in

Google sign-in uses Google's subject as the durable identity. RENTipid validates the protected provider flow and uses the connected subject to find your user. If your Google email changes but the subject stays connected, the account relationship remains the same.

Use the Google account you intend to connect. On shared devices, verify the avatar/account picker before approving.

## 28. WhatsApp OTP safety

- A code is for one active challenge and expires quickly.
- Never read it to support or paste it into chat.
- Do not approve a sign-in you did not start.
- Repeated requests may be blocked temporarily.
- The channel is WhatsApp, not SMS.
- A completed code cannot be replayed.
- Keep WhatsApp device access, SIM and linked devices secure.

## 29. Email/password safety

- Use at least eight characters; prefer a long generated password.
- Never reuse a password from another service.
- Complete email verification.
- Treat reset links as sensitive one-time secrets.
- Use only the newest reset/verification email you requested.
- After an unexpected reset or sign-in alert, secure your email account and review RENTipid sessions.

## 30. Common login problems

| What you see | What it usually means | What to do next |
|---|---|---|
| Sign-in method not connected | New provider resembles an existing account but is not linked | Sign in with an existing method; connect it in Account Security |
| Identity already in use | Provider identity belongs to another RENTipid user | Stop and contact support |
| Provider button missing | Method is disabled/unavailable in that environment | Use another method; support checks availability |
| Callback/redirect error | Provider registration, browser cookie or environment mismatch | Restart once; report provider, time and hostname |
| WhatsApp code missing | Delivery delay, wrong number or rate limit | Verify number/country code; wait; request once more |
| Code expired | Five-minute window passed | Request a new code |
| Invalid credentials | Email/password proof did not succeed | Retry or use recovery; verify email if required |
| Cannot disconnect | It is the final method | Connect and test another method first |
| Returned to login | Session expired, was revoked or account status changed | Sign in again; review sessions if unexpected |

For more detail, see the [Troubleshooting Guide](06_RENTipid_Unified_Multi_Login_Troubleshooting_Guide_v1.1.0.md).

## 31. User FAQ

### Is one method the “main” account?

No external provider owns the RENTipid account. The internal RENTipid user ID is the permanent account identity.

### Can I use different emails at different providers?

Yes, if each provider identity is explicitly connected to the same RENTipid user. Email equality is not required after secure linking.

### Can two RENTipid users share one Google identity?

No. One provider subject can belong to only one RENTipid user.

### Does disconnecting Apple delete my Apple account?

No. It removes the RENTipid link only.

### Can support link accounts from screenshots?

No. Screenshots or matching emails are not sufficient proof for secure provider ownership.

### Can I use SMS instead of WhatsApp?

Not in v1.1.0. SMS public login is retired.

### Why are recovery messages generic?

Generic wording makes it harder for an attacker to discover which email addresses are registered.

### What should I report to support?

Report the hostname, provider, approximate time, device/browser type and exact error wording. Do not include credentials, codes, cookies or tokens.
