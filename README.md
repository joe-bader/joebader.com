# joebader.com

Personal resume site — dark-themed, single-page, hosted on GitHub Pages.

## Setup

### Local development

Open `index.html` in a browser, or run a local server:

```bash
# Python 3
python -m http.server 8000

# Node (npx)
npx serve
```

Then visit `http://localhost:8000`.

### Formspree (contact form)

The contact form uses [Formspree](https://formspree.io). The form ID `xdadbbnr` is already configured in `index.html`.

- Submissions are sent to your Formspree account
- You receive emails for each submission
- Free tier: 1,000 submissions/month

To change the form endpoint, edit the `action` attribute in the contact form in `index.html`.

### reCAPTCHA (spam protection)

If Formspree returns "Please complete the reCAPTCHA", reCAPTCHA v3 is enabled on your form. Add your site key:

1. Create a reCAPTCHA v3 key at [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Add your domain and copy the **site key**
3. In Formspree form settings, enable reCAPTCHA and paste the **secret key**
4. In `index.html`, replace `YOUR_RECAPTCHA_SITE_KEY` in the form's `data-recaptcha-site-key` attribute with your site key

**If you get "browser-error":** Add your domain to the reCAPTCHA key in [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin) → your key → Domains. For local testing, add `localhost`. Ad blockers or privacy extensions can also cause this—try disabling them.

## Deployment (GitHub Pages)

1. Push this repo to GitHub (e.g., `joebader/joebader.com` or `joebader/joebader.github.io`).

2. In the repo: **Settings → Pages**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` (or `master`)
   - **Folder:** `/ (root)`
   - Save

3. The site will be available at:
   - `https://<username>.github.io/joebader.com/` (if repo is `joebader.com`)
   - `https://<username>.github.io/` (if repo is `joebader.github.io`)

### Custom domain (joebader.com)

1. Add a file named `CNAME` in the project root with:
   ```
   joebader.com
   ```

2. Configure DNS with your domain provider:
   - **A records** for `joebader.com` and `www.joebader.com`:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Or a **CNAME** for `www` pointing to `joebader.github.io`

3. In GitHub Pages settings, set the custom domain to `joebader.com`.

See [GitHub's custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for details.
