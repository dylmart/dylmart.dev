# Ops — Phase 1 (home-server parking)

One-time setup, run by Dylan (Claude's sudo is read-only):

    sudo mkdir -p /srv/http/dylmart && sudo chown "$USER": /srv/http/dylmart
    sudo cp ops/nginx/dylmart.conf /etc/nginx/conf.d/dylmart.conf
    sudo nginx -t && sudo systemctl reload nginx

Every deploy after that (no sudo):

    npm run deploy

Reachability: tailnet (any tailscale device) and home LAN. Public exposure via
Funnel is a deliberate later decision — do not add it casually, and never touch
the server's existing reverse-proxy or funnel setup.
