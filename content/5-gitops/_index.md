+++
title = "Configure GitOps"
weight = 10
+++

- Install GitOps Operator from Operator Hub
- Clone GitOps Repo to Gitea
 https://github.com/devsecops-workshop/openshift-gitops-getting-started.git
- Create OpenShift Project deepspace-prod
- Give Puller Permissions
```
oc policy add-role-to-user \
    system:image-puller system:serviceaccount:deepspace-prod:default \
    --namespace=deepspace-int
```
- Go to ArgoCD URL
- Password will be in Secret openshift-gitops-cluster
- Create App
  - Application name : quarkus-options
  - Project : default
  - Self Heal
  - Repo URL : https://repository-gitea.apps.ocp4.nexus-eight.com/gitea/openshift-gitops-getting-started.git
  - Path : app
  - Cluster URL : https://kubernetes.default.svc
  - Namespace : deespace-prod
