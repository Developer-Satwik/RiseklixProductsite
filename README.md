# riseklix.com

The Riseklix website. Netlify deploys the `public/` folder of the `main` branch.

- `public/` is the finished site. Don't edit it by hand: it is generated, and the next update replaces it.
- `netlify/functions/` holds the newsletter sign-up function. It needs `BEEHIIV_API_KEY` set in Netlify's environment variables.
- `netlify.toml` sets the publish folder and the functions folder.

Redirects are in `public/_redirects` and headers in `public/_headers`.
