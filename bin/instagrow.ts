#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InstagrowStack } from '../lib/instagrow-stack';
import { Team } from '../lib/cdk-types';

const app = new cdk.App();
const team: Team = app.node.tryGetContext('team');

const teamToRegionMap = {
    'team-1': 'eu-west-1',
    'team-2': 'eu-west-2',
    'team-3': 'eu-central-1',
};

const region = teamToRegionMap[team];

if (!team || !region) {
    throw new Error('Must pass in team name via "-c team=team1"');
}

new InstagrowStack(app, `Instagrow-${team}`, { env: { region } });
