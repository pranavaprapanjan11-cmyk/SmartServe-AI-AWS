const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function trySecret(name) {
  console.log("Trying secret name:", name);
  try {
    const data = await client.send(new GetSecretValueCommand({ SecretId: name }));
    console.log(`✔ SUCCESS! Secret found for ${name}:`);
    console.log(data.SecretString);
    return true;
  } catch (err) {
    console.log(`Failed for ${name}:`, err.message);
    return false;
  }
}

async function run() {
  const names = [
    "rds-db-credentials/cluster-ANFRD563ZV7CXIZQZOBWUJ6PCU/postgres",
    "rds-db-credentials/database-2/postgres",
    "rds-db-credentials/postgres",
    "database-2",
    "postgres"
  ];
  for (const name of names) {
    const ok = await trySecret(name);
    if (ok) break;
  }
}

run();
