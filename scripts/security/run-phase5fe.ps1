$env:PGPASSWORD='phase5fetemppass'
docker run --name rentipid-phase5fe-db -e POSTGRES_PASSWORD=phase5fetemppass -d -p 5434:5432 postgres:16
Start-Sleep -Seconds 8

docker exec rentipid-phase5fe-db psql -U postgres -c "CREATE DATABASE rentipid_test_soc;"

$env:DATABASE_URL="postgresql://postgres:phase5fetemppass@127.0.0.1:5434/rentipid_test_soc"
npx prisma db push --accept-data-loss --force-reset

echo "--- Running Jest Tests ---"
npx jest tests/security/crypto/phase5fe-key-rotation.test.ts --runInBand

echo "--- Running Rotation Drill ---"
$env:NODE_OPTIONS="--conditions=react-server"
npx tsx scripts/security/phase5f-e-key-rotation-drill.ts
Remove-Item Env:\NODE_OPTIONS

docker stop rentipid-phase5fe-db
docker rm rentipid-phase5fe-db
