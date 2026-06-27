const { RDSClient, DeleteDBClusterCommand } = require("@aws-sdk/client-rds");

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  console.log("Deleting cluster database-1 to free up a slot...");
  try {
    const data = await client.send(new DeleteDBClusterCommand({
      DBClusterIdentifier: "database-1",
      SkipFinalSnapshot: true
    }));
    console.log("✔ SUCCESS! Cluster deletion initiated.");
    console.log("Status:", data.DBCluster.Status);
  } catch (err) {
    console.error("Failed to delete cluster:", err.message);
  }
}

run();
