const { RDSClient, RebootDBInstanceCommand } = require("@aws-sdk/client-rds");

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  console.log("Rebooting DB instance database-2-instance-1...");
  try {
    const data = await client.send(new RebootDBInstanceCommand({
      DBInstanceIdentifier: "database-2-instance-1"
    }));
    console.log("✔ SUCCESS! Reboot initiated.");
    console.log("Status:", data.DBInstance.DBInstanceStatus);
  } catch (err) {
    console.error("Failed to reboot instance:", err.message);
  }
}

run();
