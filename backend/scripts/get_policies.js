const { IAMClient, ListAttachedUserPoliciesCommand, ListUserPoliciesCommand, GetUserPolicyCommand } = require("@aws-sdk/client-iam");

const client = new IAMClient({
  region: 'us-east-1', // IAM is global but client region works
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function run() {
  const username = "smartserve-backend";
  console.log(`Getting policies for user ${username}...`);
  
  try {
    const attached = await client.send(new ListAttachedUserPoliciesCommand({ UserName: username }));
    console.log("Attached policies:", attached.AttachedPolicies.length);
    attached.AttachedPolicies.forEach(p => {
      console.log(`- PolicyName: ${p.PolicyName}, Arn: ${p.PolicyArn}`);
    });
  } catch (err) {
    console.error("Failed to list attached policies:", err.message);
  }

  try {
    const inline = await client.send(new ListUserPoliciesCommand({ UserName: username }));
    console.log("Inline policies:", inline.PolicyNames.length);
    for (const name of inline.PolicyNames) {
      console.log(`- PolicyName: ${name}`);
      try {
        const detail = await client.send(new GetUserPolicyCommand({ UserName: username, PolicyName: name }));
        console.log("Policy Document:", decodeURIComponent(detail.PolicyDocument));
      } catch (e) {
        console.error("Failed to get inline policy document:", e.message);
      }
    }
  } catch (err) {
    console.error("Failed to list inline policies:", err.message);
  }
}

run();
