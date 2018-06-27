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
  logsPlugin:
    LogGroup:
      RetentionInDays: 14  # optional, default: 90
    SubscriptionFilter: # optional, default: no SubscriptionFilter resource is added
      DestinationArn: my-destination-arn
      FilterPattern: my-filtern-pattern  # optional, default: '{ $.NotExistingField NOT EXISTS }'
      RoleArn: my-role-arn  # optional, default: null
    additionalSubscriptions: # optional, default: no additional SubscriptionFilter
      - DependsOn: ElasticBeanstalkApp
        LogGroupNames:
          - /aws/elasticbeanstalk/myapp/var/log/eb-activity.log
          - /aws/elasticbeanstalk/myapp/var/log/nginx/access.log
          - /aws/elasticbeanstalk/myapp/var/log/nginx/error.log
          - /aws/elasticbeanstalk/myapp/var/log/web-1.error.log
          - /aws/elasticbeanstalk/myapp/var/log/web-1.log
...
```

As a result, the plugin will produce, for each lambda function a resource to set the RetentionInDays to the log group and a resource to subscribe the log group:
```
    "MyFunctionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": "/aws/lambda/MyFunction",
        "RetentionInDays": 90
      }
    },
    "MyFunctionSubscriptionFilter": {
      "Type": "AWS::Logs::SubscriptionFilter",
      "DependsOn": "MyFunctionLambdaFunction",
      "Properties": {
        "DestinationArn": "my-destination-arn",
        "LogGroupName": "/aws/lambda/MyFunction",
        "FilterPattern": "{ $.NotExistingField NOT EXISTS }"
      }
    }  
```

For each additionalSubscriptions, a subscription resource is produced:
```
    "AwselasticbeanstalkmyappvarlogwebDash1logSubscriptionFilter": {
      "Type": "AWS::Logs::SubscriptionFilter",
      "DependsOn": "ElasticBeanstalkApp",
      "Properties": {
        "DestinationArn": "my-destination-arn",
        "LogGroupName": "/aws/elasticbeanstalk/myapp/var/log/web-1.log",
        "FilterPattern": "{ $.NotExistingField NOT EXISTS }"
      }
    }
```


