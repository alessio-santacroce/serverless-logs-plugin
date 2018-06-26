# serverless-logs-plugin
A serverless framework plugin for AWS to add log retention and the resource to subscribe log groups


## Usage

Install from npm:
```
npm i --save serverless-logs-plugin
```

In serverless.yml add the plugin:
```
plugins:
  - serverless-logs-plugin
```

In serverless.yml add the configuration:
```
...
provider:
...
  logsPlugin:
    LogGroup:
      RetentionInDays: 17  # default 14
    SubscriptionFilter:
      DestinationArn: my-destination-arn
      FilterPattern: my-filtern-pattern  # default '{ $.NotExistingField NOT EXISTS }'
      RoleArn: my-role-arn  # default null
...
```