const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");

const client = new STSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  console.log("Getting identity...");
  try {
    const data = await client.send(new GetCallerIdentityCommand({}));
    console.log("Account:", data.Account);
    console.log("UserId:", data.UserId);
    console.log("Arn:", data.Arn);
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

run();
