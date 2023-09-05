import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ThingWithCert } from 'cdk-iot-core-certificates';

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
    }
}
