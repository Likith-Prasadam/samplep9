# Runtime stage - Use pre-built dist from GitHub Actions
FROM node:20-alpine AS runtime
 
WORKDIR /app
 
# Install serve and curl for healthcheck
RUN npm install -g serve && apk add --no-cache curl
 
# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy pre-built dist folder from build context (provided by GitHub Actions)
COPY --chown=nextjs:nodejs ./dist ./dist
 
USER nextjs
 
EXPOSE 3000
 
# Healthcheck with proper settings
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1
 
# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]