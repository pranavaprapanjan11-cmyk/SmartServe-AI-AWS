const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');

const client = new RDSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  try {
    const data = await client.send(new DescribeDBInstancesCommand({}));
    data.DBInstances.forEach(i => {
      console.log(`Instance: ${i.DBInstanceIdentifier}`);
      console.log(`- Security Groups:`, i.VpcSecurityGroups.map(sg => sg.VpcSecurityGroupId));
    });
  } catch (err) {
    console.error(err);
  }
}

run();
