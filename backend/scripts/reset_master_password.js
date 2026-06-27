const { RDSClient, ModifyDBClusterCommand } = require("@aws-sdk/client-rds");

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  const newPassword = "SmartServeTempPass123!"; // Temporary master password
  console.log(`Attempting to reset master password for cluster database-2 to '${newPassword}'...`);
  try {
    const data = await client.send(new ModifyDBClusterCommand({
      DBClusterIdentifier: "database-2",
      MasterUserPassword: newPassword,
      ApplyImmediately: true
    }));
    console.log("✔ SUCCESS! Cluster modification initiated.");
    console.log("Cluster status:", data.DBCluster.Status);
    console.log("Please wait 1-2 minutes for the password reset to apply, then connect using the new password to run: GRANT rds_iam TO postgres;");
  } catch (err) {
    console.error("Failed to reset password:", err.message);
  }
}

run();
