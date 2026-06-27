const { RDSClient, DescribeDBClustersCommand, DescribeDBInstancesCommand } = require("@aws-sdk/client-rds");

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  console.log("Describing clusters...");
  try {
    const data = await client.send(new DescribeDBClustersCommand({}));
    console.log("Clusters found:", data.DBClusters.length);
    data.DBClusters.forEach(c => {
      console.log(`Cluster: ${c.DBClusterIdentifier}`);
      console.log(`- Resource ID: ${c.DbClusterResourceId}`);
      console.log(`- Endpoint: ${c.Endpoint}`);
      console.log(`- Port: ${c.Port}`);
      console.log(`- Engine: ${c.Engine}`);
      console.log(`- Status: ${c.Status}`);
      console.log(`- IAM Auth Enabled: ${c.IAMDatabaseAuthenticationEnabled}`);
      console.log(`- Master User: ${c.MasterUsername}`);
    });
  } catch (err) {
    console.error("Failed to describe clusters:", err.message);
  }

  console.log("\nDescribing instances...");
  try {
    const data = await client.send(new DescribeDBInstancesCommand({}));
    console.log("Instances found:", data.DBInstances.length);
    data.DBInstances.forEach(i => {
      console.log(`Instance: ${i.DBInstanceIdentifier}`);
      console.log(`- Dbi Resource ID: ${i.DbiResourceId}`);
      console.log(`- Cluster membership: ${i.DBClusterIdentifier}`);
      console.log(`- Endpoint: ${i.Endpoint?.Address}:${i.Endpoint?.Port}`);
      console.log(`- Status: ${i.DBInstanceStatus}`);
      console.log(`- IAM Auth Enabled: ${i.IAMDatabaseAuthenticationEnabled}`);
    });
  } catch (err) {
    console.error("Failed to describe instances:", err.message);
  }
}

run();
