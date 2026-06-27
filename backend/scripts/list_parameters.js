const { RDSClient, DescribeDBClusterParametersCommand } = require("@aws-sdk/client-rds");

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  console.log("Describing parameters...");
  try {
    const data = await client.send(new DescribeDBClusterParametersCommand({
      DBClusterParameterGroupName: "default.aurora-postgresql16" // or custom
    }));
    console.log("Parameters found:", data.Parameters.length);
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

run();
