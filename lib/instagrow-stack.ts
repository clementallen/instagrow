import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ThingWithCert } from 'cdk-iot-core-certificates';
import * as iot from '@aws-cdk/aws-iot-alpha';
import * as iotActions from '@aws-cdk/aws-iot-actions-alpha';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Team } from './cdk-types';

export class InstagrowStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const team: Team = this.node.tryGetContext('team');

        const { thingArn, certId, certPem, privKey } = new ThingWithCert(this, 'thing', {
            thingName: `instagrow-${team}`,
        });

        // new cdk.CfnOutput(this, `Output-ThingArn-${team}`, {
        //     value: thingArn,
        // });

        // new cdk.CfnOutput(this, `Output-CertId-${team}`, {
        //     value: certId,
        // });

        // new cdk.CfnOutput(this, `Output-CertPem-${team}`, {
        //     value: certPem,
        // });

        new cdk.CfnOutput(this, `Output-PrivKey-${team}`, {
            value: privKey,
        });

        const func = new NodejsFunction(this, 'trigger', {
            functionName: `instagrow-trigger-${team}`,
            runtime: Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: './lib/lambdas/iot-receiver.ts',
        });

        const rule = new iot.TopicRule(this, 'rule', {
            sql: iot.IotSql.fromStringAsVer20160323("SELECT * FROM 'instagrow/pi/from'"),
            actions: [new iotActions.LambdaFunctionAction(func)],
            topicRuleName: `instagrow_lambda_trigger_${team.replace('-', '_')}`,
        });
    }
}
