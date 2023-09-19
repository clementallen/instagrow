import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ThingWithCert } from 'cdk-iot-core-certificates';
import * as iot from '@aws-cdk/aws-iot-alpha';
import * as iotActions from '@aws-cdk/aws-iot-actions-alpha';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Team } from './cdk-types';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class InstagrowStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const team: Team = this.node.tryGetContext('team');

        const { privKey } = new ThingWithCert(this, 'thing', {
            thingName: `instagrow-${team}`,
        });

        new cdk.CfnOutput(this, `Output-PrivKey-${team}`, {
            value: privKey,
        });

        const receiverFunction = new NodejsFunction(this, 'trigger', {
            functionName: `instagrow-trigger-${team}`,
            runtime: Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: './lib/lambdas/iot-receiver.ts',
        });

        const initialPolicy = [
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['iot:Publish'],
                resources: ['*'],
            }),
        ];

        const senderFunction = new NodejsFunction(this, 'sender', {
            functionName: `instagrow-sender-${team}`,
            runtime: Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: './lib/lambdas/iot-sender.ts',
            initialPolicy,
        });

        const rule = new iot.TopicRule(this, 'rule', {
            sql: iot.IotSql.fromStringAsVer20160323("SELECT * FROM 'instagrow/pi/from'"),
            actions: [new iotActions.LambdaFunctionAction(receiverFunction)],
            topicRuleName: `instagrow_lambda_trigger_${team.replace('-', '_')}`,
        });
    }
}
