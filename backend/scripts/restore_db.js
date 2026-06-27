const { RDSClient, RestoreDBClusterToPointInTimeCommand } = require("@aws-sdk/client-rds");

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  const restoreTime = new Date("2026-06-27T13:10:00.000Z");
  console.log(`Initiating PITR of database-2 to database-2-restored at ${restoreTime.toISOString()}...`);
  try {
    const data = await client.send(new RestoreDBClusterToPointInTimeCommand({
      SourceDBClusterIdentifier: "database-2",
      DBClusterIdentifier: "database-2-restored",
      RestoreToTime: restoreTime
    }));
    console.log("✔ SUCCESS! Point-in-time restore initiated.");
    console.log("Cluster identifier:", data.DBCluster.DBClusterIdentifier);
    console.log("Status:", data.DBCluster.Status);
  } catch (err) {
    console.error("Failed to restore cluster:", err.message);
  }
}

run();
