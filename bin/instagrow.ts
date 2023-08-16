#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InstagrowStack } from '../lib/instagrow-stack';

const app = new cdk.App();
new InstagrowStack(app, 'InstagrowStack', {});
