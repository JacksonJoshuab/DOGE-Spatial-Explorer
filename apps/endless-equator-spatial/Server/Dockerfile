FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=8787

WORKDIR /app

COPY --chown=node:node Server/package.json Server/server.mjs ./Server/
COPY --chown=node:node Web ./Web
COPY --chown=node:node Sources/EndlessEquatorCore/Resources ./Sources/EndlessEquatorCore/Resources

USER node
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "Server/server.mjs"]
