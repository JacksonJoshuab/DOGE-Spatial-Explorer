targetScope = 'resourceGroup'

@description('Short lowercase deployment prefix.')
param prefix string = 'endlessequator'

@description('Azure region for the production gateway.')
param location string = resourceGroup().location

var safePrefix = toLower(replace(prefix, '-', ''))
var suffix = uniqueString(resourceGroup().id)
var logName = '${prefix}-logs'
var environmentName = '${prefix}-env'
var identityName = '${prefix}-identity'
var acrName = take('${safePrefix}${suffix}', 50)

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logName
  location: location
  properties: {
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
    zoneRedundant: false
  }
}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
}

resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    policies: {
      quarantinePolicy: {
        status: 'disabled'
      }
      retentionPolicy: {
        days: 14
        status: 'enabled'
      }
      trustPolicy: {
        type: 'Notary'
        status: 'disabled'
      }
    }
  }
}

output managedEnvironmentName string = environment.name
output identityName string = identity.name
output identityPrincipalId string = identity.properties.principalId
output registryName string = registry.name
output registryLoginServer string = registry.properties.loginServer
output logAnalyticsWorkspaceName string = logs.name
