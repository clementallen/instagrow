import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ThingWithCert } from 'cdk-iot-core-certificates';
import * as iot from '@aws-cdk/aws-iot-alpha';
import * as iotActions from '@aws-cdk/aws-iot-actions-alpha';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class InstagrowStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const { thingArn, certId, certPem, privKey } = new ThingWithCert(this, 'thing', {
            thingName: 'instagrow',
            saveToParamStore: true,
            paramPrefix: 'devices',
        });

        new cdk.CfnOutput(this, 'Output-ThingArn', {
            value: thingArn,
        });

        new cdk.CfnOutput(this, 'Output-CertId', {
            value: certId,
        });

        new cdk.CfnOutput(this, 'Output-CertPem', {
            value: certPem,
        });

        new cdk.CfnOutput(this, 'Output-PrivKey', {
            value: privKey,
        });

        const func = new NodejsFunction(this, 'trigger', {
            functionName: 'instagrow-trigger',
            runtime: Runtime.NODEJS_18_X,
            handler: 'handler',
            entry: './lib/lambdas/iot-receiver.ts',
        });

        const rule = new iot.TopicRule(this, 'rule', {
            sql: iot.IotSql.fromStringAsVer20160323("SELECT * FROM 'instagrow/received'"),
            actions: [new iotActions.LambdaFunctionAction(func)],
            topicRuleName: 'instagrow_lambda_trigger',
        });
    }
}
