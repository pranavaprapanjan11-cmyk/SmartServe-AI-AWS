const { RDSClient, DescribeDBClusterSnapshotsCommand } = require("@aws-sdk/client-rds");

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  console.log("Listing snapshots for cluster database-2...");
  try {
    const data = await client.send(new DescribeDBClusterSnapshotsCommand({
      DBClusterIdentifier: "database-2"
    }));
    console.log("Snapshots found:", data.DBClusterSnapshots.length);
    data.DBClusterSnapshots.forEach(s => {
      console.log(`Snapshot: ${s.DBClusterSnapshotIdentifier}`);
      console.log(`- Type: ${s.SnapshotType}`);
      console.log(`- Status: ${s.Status}`);
      console.log(`- Created: ${s.SnapshotCreateTime}`);
    });
  } catch (err) {
    console.error("Failed to list snapshots:", err.message);
  }
}

run();
