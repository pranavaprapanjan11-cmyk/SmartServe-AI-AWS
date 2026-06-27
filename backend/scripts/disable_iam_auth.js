const { RDSClient, ModifyDBClusterCommand } = require("@aws-sdk/client-rds");

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  console.log("Disabling IAM Database Authentication for cluster database-2...");
  try {
    const data = await client.send(new ModifyDBClusterCommand({
      DBClusterIdentifier: "database-2",
      EnableIAMDatabaseAuthentication: false,
      ApplyImmediately: true
    }));
    console.log("✔ SUCCESS! Cluster modification to disable IAM Auth initiated.");
    console.log("Cluster status:", data.DBCluster.Status);
  } catch (err) {
    console.error("Failed to disable IAM Auth:", err.message);
  }
}

run();
