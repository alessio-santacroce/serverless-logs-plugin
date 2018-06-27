'use strict';

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.hooks = {
        'after:package:initialize': this.afterPackageInitialize.bind(this),
    };
  }

  afterPackageInitialize() {
    const config = this.fetchConfig()

    const functions = this.serverless.service.functions
    const resources = this.serverless.service.resources.Resources
    const cli = this.serverless.cli

    const addLogSubscriptionResource = function(resourceName, logGroupName, dependsOn) {
        if (!config.SubscriptionFilter.DestinationArn) {
            return;
        }
        resources[resourceName] = {
            'Type' : 'AWS::Logs::SubscriptionFilter',
            'DependsOn' : dependsOn,
            'Properties': {
                'DestinationArn': config.SubscriptionFilter.DestinationArn,
                'LogGroupName': logGroupName,
                'FilterPattern': config.SubscriptionFilter.FilterPattern
            }
        };
        if (config.SubscriptionFilter.RoleArn) {
            resources[resourceName]['Properties']['RoleArn'] = config.SubscriptionFilter.RoleArn
        }
        cli.log('Added resource Subscription for log group ' + logGroupName);
    }

    for(var func in functions) {
        const normalizedFunctionName = this.normalizeResourceName(func)
        const logGroupName = '/aws/lambda/' + functions[func]['name']
        resources[normalizedFunctionName + 'LogGroup'] = {
            'Properties': {
                'LogGroupName': logGroupName,
                'RetentionInDays': config.LogGroup.RetentionInDays
            }
        }
        cli.log('Added RetentionInDays ' + config.RetentionInDays +' for log group ' + logGroupName);

        const subscriptionResourceName = normalizedFunctionName + 'SubscriptionFilter';
        const dependsOn = normalizedFunctionName + 'LambdaFunction';
        addLogSubscriptionResource(subscriptionResourceName, logGroupName, dependsOn);
    }

    for (var i = 0; i < config.additionalSubscriptions.length; i++) {
        const subscription = config.additionalSubscriptions[i];
        for (var j = 0; j < subscription.LogGroupNames.length; j++) {
            const logGroupName = subscription.LogGroupNames[j];
            const resourceName = this.normalizeResourceName(logGroupName) + 'SubscriptionFilter';
            cli.log('Adding Subscription for log group ' + logGroupName);
            addLogSubscriptionResource(resourceName, logGroupName, subscription.DependsOn);
        }
    }
  }

  fetchConfig() {
    const config = this.serverless.service.provider.logsPlugin || {}
    // setting defaults for missing parameters
    config.LogGroup = config.LogGroup || {};
    config.LogGroup.RetentionInDays = config.LogGroup.RetentionInDays || 90;
    config.SubscriptionFilter = config.SubscriptionFilter || {};
    config.SubscriptionFilter.FilterPattern = config.SubscriptionFilter.FilterPattern || '{ $.NotExistingField NOT EXISTS }'; // filter to accept all logs
    config.additionalSubscriptions = config.additionalSubscriptions || [];
    return config;
  }

  normalizeResourceName(name) {
    name = this.replaceAll(name, '.', '');
    name = this.replaceAll(name, '/', '');
    name = this.replaceAll(name, '-', 'Dash');
    name = this.replaceAll(name, '_', 'Underscore');
    return name.charAt(0).toUpperCase() + name.substr(1);
  }

  replaceAll(str, oldToken, newToken) {
    while (str.indexOf(oldToken) > -1) {
        str = str.replace(oldToken, newToken);
    }
    return str;
  }
}

module.exports = ServerlessPlugin;
