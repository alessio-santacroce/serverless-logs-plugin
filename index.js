'use strict';

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.hooks = {
        'after:package:initialize': this.afterPackageInitialize.bind(this),
    };
  }

  normalizeFunctionName(name) {
    name = name.replace('-', 'Dash').replace('_', 'Underscore');
    return name.charAt(0).toUpperCase() + name.substr(1);
  }

  afterPackageInitialize() {
    const config = this.serverless.service.provider.logPlugin
    // setting defaults for missing config parameters
    config.LogGroup = config.LogGroup || {};
    config.LogGroup.RetentionInDays = config.LogGroup.RetentionInDays || 14;
    config.SubscriptionFilter = config.SubscriptionFilter || {}
    config.SubscriptionFilter.FilterPattern = config.SubscriptionFilter.FilterPattern || '{ $.NotExistingField NOT EXISTS }'; // filter to accept all logs

    const functions = this.serverless.service.functions
    const resources = this.serverless.service.resources.Resources
    for(var func in functions) {
        this.serverless.cli.log('Adding Log RetentionInDays ' + config.RetentionInDays +' for function ' + func);
        const normalizedFunctionName = this.normalizeFunctionName(func)
        const logGroup = normalizedFunctionName + 'LogGroup'
        const logGroupName = '/aws/lambda/' + functions[func]['name']
        resources[logGroup] = {
            'Properties': {
                'LogGroupName': logGroupName,
                'RetentionInDays': config.RetentionInDays
            }
        }
        if (config.SubscriptionFilter.DestinationArn) {
            this.serverless.cli.log('Adding Log Subscription for function ' + func);
            resources[normalizedFunctionName + 'SubscriptionFilter'] = {
                'Type' : 'AWS::Logs::SubscriptionFilter',
                'Properties': {
                    'DestinationArn': config.SubscriptionFilter.DestinationArn,
                    'LogGroupName': logGroupName,
                    'FilterPattern': config.SubscriptionFilter.FilterPattern,
                    'RoleArn': config.SubscriptionFilter.RoleArn
                }
            }
        }
    }
  }
}

module.exports = ServerlessPlugin;
