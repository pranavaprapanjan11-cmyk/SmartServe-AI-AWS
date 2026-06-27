const { SecretsManagerClient, CreateSecretCommand } = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  console.log("Attempting to create secret for database-2 master user...");
  try {
    const data = await client.send(new CreateSecretCommand({
      Name: "rds-db-credentials/database-2/postgres-temp",
      Description: "Temporary credentials for database-2",
      SecretString: JSON.stringify({
        username: "postgres",
        password: "SmartServeTempPass123!"
      })
    }));
    console.log("✔ SUCCESS! Secret created.");
    console.log("Secret ARN:", data.ARN);
  } catch (err) {
    console.error("Failed to create secret:", err.message);
  }
}

run();
