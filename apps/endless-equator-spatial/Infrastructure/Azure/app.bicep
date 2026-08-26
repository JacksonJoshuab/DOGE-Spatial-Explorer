targetScope = 'resourceGroup'

param location string = resourceGroup().location
param containerAppName string = 'endless-equator-gateway'
param managedEnvironmentName string
param identityName string
param registryName string
param containerImage string
param keyVaultName string
param openAISecretName string = 'endless-equator-openai-api-key'
param appleMapsPrivateKeySecretName string = 'endless-equator-apple-maps-private-key'
param openAIModel string = 'gpt-5.6-sol'
param appleMapsTeamID string
param appleMapsKeyID string
param allowedOrigins array
param mapKitAllowedOrigins array
param minReplicas int = 1
param maxReplicas int = 3

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: managedEnvironmentName
}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: identityName
}

resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: registryName
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

var acrPullRoleDefinitionID = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '7f951dda-4ed3-4680-a7ca-43fe172d538d'
)
var keyVaultSecretsUserRoleDefinitionID = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '4633458b-17de-408a-b874-0445c86b69e6'
)

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, identity.id, acrPullRoleDefinitionID)
  scope: registry
  properties: {
    roleDefinitionId: acrPullRoleDefinitionID
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource keyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, identity.id, keyVaultSecretsUserRoleDefinitionID)
  scope: keyVault
  properties: {
    roleDefinitionId: keyVaultSecretsUserRoleDefinitionID
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Multiple'
      maxInactiveRevisions: 10
      ingress: {
        external: true
        targetPort: 8787
        exposedPort: 0
        transport: 'Auto'
        allowInsecure: false
        clientCertificateMode: 'Ignore'
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [
        {
          server: registry.properties.loginServer
          identity: identity.id
        }
      ]
      secrets: [
        {
          name: 'openai-api-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/${openAISecretName}'
          identity: identity.id
        }
        {
          name: 'apple-maps-private-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/${appleMapsPrivateKeySecretName}'
          identity: identity.id
        }
      ]
    }
    template: {
      revisionSuffix: take(uniqueString(containerImage), 10)
      containers: [
        {
          name: 'gateway'
          image: containerImage
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '8787'
            }
            {
              name: 'TRUST_PROXY'
              value: 'true'
            }
            {
              name: 'OPENAI_API_KEY'
              secretRef: 'openai-api-key'
            }
            {
              name: 'OPENAI_MODEL'
              value: openAIModel
            }
            {
              name: 'APPLE_MAPS_TEAM_ID'
              value: appleMapsTeamID
            }
            {
              name: 'APPLE_MAPS_KEY_ID'
              value: appleMapsKeyID
            }
            {
              name: 'APPLE_MAPS_PRIVATE_KEY_PEM'
              secretRef: 'apple-maps-private-key'
            }
            {
              name: 'ALLOWED_ORIGINS'
              value: join(allowedOrigins, ',')
            }
            {
              name: 'MAPKIT_ALLOWED_ORIGINS'
              value: join(mapKitAllowedOrigins, ',')
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8787
                scheme: 'HTTP'
              }
              initialDelaySeconds: 15
              periodSeconds: 30
              timeoutSeconds: 5
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 8787
                scheme: 'HTTP'
              }
              initialDelaySeconds: 5
              periodSeconds: 10
              timeoutSeconds: 3
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        cooldownPeriod: 300
        pollingInterval: 30
        rules: [
          {
            name: 'http-concurrency'
            http: {
              metadata: {
                concurrentRequests: '40'
              }
            }
          }
        ]
      }
    }
  }
  dependsOn: [
    acrPull
    keyVaultSecretsUser
  ]
}

output containerAppName string = app.name
output fqdn string = app.properties.configuration.ingress.fqdn
output revisionName string = app.properties.latestRevisionName
output defaultHTTPSURL string = 'https://${app.properties.configuration.ingress.fqdn}'
