+++
title = "Prepare Cluster"
weight = 5
+++

## Cluster Preparation

Before you start creating your application you have to prepare your cluster.

### Install and Prepare Gitea
We'll need a Git repo, so let's just install trusted `Gitea` using an operator:

- Using `oc` install the Gitea Operator
```
oc apply -f https://raw.githubusercontent.com/redhat-gpte-devopsautomation/gitea-operator/master/catalog_source.yaml
```
- Create project ‘git’
- Create CR

```apiVersion: gpte.opentlc.com/v1
kind: Gitea
metadata:
  name: gitea-with-admin
spec:
  giteaSsl: true
  giteaAdminUser: gitea
  giteaAdminPassword: "gitea"
  giteaAdminEmail: opentlc-mgr@redhat.com
```

- Login to Gitea
- Clone the example repo from https://github.com/devsecops-workshop/quarkus-build-options.git

### Install and Prepare CodeReady Workspaces
- Install CRW Operator from OperatorHub
- Create default CR
- Launch Workspace in Browser

- Login to CRW and start Workspace  e.g.
```
https://codeready-openshift-workspaces.apps.<domain>//f?url=https://raw.githubusercontent.com/devsecops-workshop/quarkus-build-options/master/devfile.yml
```
- CRW / OCP Credentials?
- Manually clone into Workspace from Gitea Repo
- Run install oc
- Run install odo
