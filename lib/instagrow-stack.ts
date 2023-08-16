import * as cdk from 'aws-cdk-lib';
import { CfnPolicy } from 'aws-cdk-lib/aws-iot';
import { Construct } from 'constructs';

export class InstagrowStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const Policy = new CfnPolicy(this, 'policy', {
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['iot:Connect', 'iot:Publish', 'iot:Recieve', 'iot:Subscribe'],
                        Resource: ['*'],
                    },
                ],
            },
            policyName: 'instagrow-policy',
        });
    }
}
