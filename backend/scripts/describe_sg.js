const { RDSClient, DescribeDBClustersCommand } = require('@aws-sdk/client-rds');

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  try {
    const data = await client.send(new DescribeDBClustersCommand({}));
    data.DBClusters.forEach(c => {
      console.log(`Cluster: ${c.DBClusterIdentifier}`);
      console.log(`- Security Groups:`, c.VpcSecurityGroups.map(sg => sg.VpcSecurityGroupId));
    });
  } catch (err) {
    console.error(err);
  }
}

run();
