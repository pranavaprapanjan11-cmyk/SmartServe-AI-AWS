const { SecretsManagerClient, ListSecretsCommand } = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  console.log("Listing Secrets Manager secrets...");
  try {
    const data = await client.send(new ListSecretsCommand({}));
    console.log("Secrets found:", data.SecretList.length);
    data.SecretList.forEach(s => {
      console.log(`Secret: ${s.Name}`);
      console.log(`- Description: ${s.Description}`);
      console.log(`- ARN: ${s.ARN}`);
      console.log(`- Last Rotated: ${s.LastRotatedDate}`);
    });
  } catch (err) {
    console.error("Failed to list secrets:", err.message);
  }
}

run();
