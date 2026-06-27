const { RDSClient, CreateDBInstanceCommand } = require("@aws-sdk/client-rds");

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  console.log("Creating DB instance database-2-restored-instance-1 inside the restored cluster...");
  try {
    const data = await client.send(new CreateDBInstanceCommand({
      DBInstanceIdentifier: "database-2-restored-instance-1",
      DBClusterIdentifier: "database-2-restored",
      DBInstanceClass: "db.serverless",
      Engine: "aurora-postgresql",
      PubliclyAccessible: true
    }));
    console.log("✔ SUCCESS! Instance creation initiated.");
    console.log("Instance identifier:", data.DBInstance.DBInstanceIdentifier);
    console.log("Status:", data.DBInstance.DBInstanceStatus);
  } catch (err) {
    console.error("Failed to create instance:", err.message);
  }
}

run();
