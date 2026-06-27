const { RDSClient, ModifyDBClusterCommand } = require("@aws-sdk/client-rds");

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  const newPassword = "pranav06";
  console.log(`Setting master password for cluster database-2 to '${newPassword}'...`);
  try {
    const data = await client.send(new ModifyDBClusterCommand({
      DBClusterIdentifier: "database-2",
      MasterUserPassword: newPassword,
      ApplyImmediately: true
    }));
    console.log("✔ SUCCESS! Cluster password change initiated.");
    console.log("Cluster status:", data.DBCluster.Status);
  } catch (err) {
    console.error("Failed to reset password:", err.message);
  }
}

run();
