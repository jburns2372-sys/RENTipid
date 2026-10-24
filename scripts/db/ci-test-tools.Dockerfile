# Test infrastructure only. Product schema and legacy migrations are unaffected.
FROM postgres:16
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
