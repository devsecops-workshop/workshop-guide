+++
title = "Prepare Cluster"
weight = 5
+++

## Cluster Preparation

Before you start you have to install a number of components you'll use during the workshop. The first two are `Gitea` for providing Git services in your cluster and `CodeReady Workspaces` as development environment. But fear not, both are managed by an operator.

## Install and Prepare Gitea
We'll need Git repository srvices, so let's just install trusted `Gitea` using an operator:

{{% notice tip %}}
This is a good example of how you can integrate an operator into your catalog that is not part of the default OperatorHub already.
{{% /notice %}}

- Log in the `oc` command to your OpenShift cluster (the easiest way is to use the **Copy login command** link in the OCP web UI).
- Now using `oc` add the Gitea Operator to your OperatorHub
```
oc apply -f https://raw.githubusercontent.com/redhat-gpte-devopsautomation/gitea-operator/master/catalog_source.yaml
```
- Go to OperatorHub and search for `Gitea`
- Install the `Gitea Operator` with default settings
- Create a new project `git`
- Go to **Installed Operators -> Gitea Operator** and click **Create instance** in the new project.
- On the **Create Gitea** page switch to the YAML view and make sure the following `spec` values exist:

```
spec:
  giteaSsl: true
  giteaAdminUser: gitea
  giteaAdminPassword: "gitea"
  giteaAdminEmail: opentlc-mgr@redhat.com
```
- Click **Create**

After creation has finished:
- Look up and access the `repository` route, this will take you to the Gitea web UI
- Login to Gitea with user `gitea` and password `gitea`
- Clone the example repo:
  - Click the **+** dropdown and choose **New Migration**
  - As type choose **Git**
  - **URL**: https://github.com/devsecops-workshop/quarkus-build-options.git
  - Click **Migrate Repository**

In the cloned repository you'll find a `devfile.yml` for use with CodeReady Workspaces (CRW). You have to edit the file to point to your own repository:
- Copy the clone URL of your repo.
- Edit the `devfile.yml` by clicking it and selecting the **Edit File** pencil icon.
  - In the file change **location:** to the clone URL you just copied.
  - Commit changes

## Install and Prepare CodeReady Workspaces (CRW)
- Install the CRW Operator from OperatorHub (not the Tech Preview one!) using default settings.
- Go to **Installed Operators -> CodeReady Workspaces** and create a new instance (CodeReady Workspaces instance Specification) using the default settings.
- Wait until deployment has finished.

As you'll start your CRW workspace using the devfile mechanism, you have to compose the URL from the codeready route and the devfile location.
- First look up the `codeready` route and the full URL to access the `devfile.yml` in Gitea by using the "raw" format button.
- Now use both components to build an URL like below:
```
https://<codeready-openshift-route>/f?url=<full URL to devfile.yml>
```
For example it could look like this:
```
https://<codeready-openshift-workspaces.apps.cluster-mqpmq.mqpmq.sandbox283.opentlc.com/f?url=https://repository-git.apps.cluster-mqpmq.mqpmq.sandbox283.opentlc.com/gitea/quarkus-build-options/raw/branch/master/devfile.yml
```
- Now use this URL to launch your CRW Workspace in your Browser
  - Log in as User opentlc-mgr
  - Apply permissions
  - In the next form add an email address, it will be added to Keycloak

Have a good look around the UI, it should look familiar if you have ever worked with VSCode and the like. To prepare the Workspace for developing with OpenShift, ru the following steps:

- In the CRW shortcuts menu to the right
  - Run **install oc**
  - Run **install odo**
- Close the tabs the installation opened.
