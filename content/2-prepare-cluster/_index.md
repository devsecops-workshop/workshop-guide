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
- Go to OperatorHub and search for `Gitea` (You may need to disable search filters)
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
- On the left click on 'Networking > Routes > repository > Location' 
- This will take you to the Gitea web UI
- Sign-In to Gitea with user `gitea` and password `gitea`
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
- Wait until deployment has finished. This may take a couple of minutes as several components will be deployed. 
- Once the instance status is ready look up the `codeready` Route in the 'openshift-workspaces' namespace
- Open the link in a new tab and log in with your OCP credentials
- Apply permissions
- Enter an email, First Name and Last Name to set up your account

We could create a workspace from one of the templates that come with CodeReady but we want to use a customized workspace with some additional defined plugins in a devfile in our git repo. 

- So at the top click on 'Custom Workspace'
- In 'Enter the devfile URL' enter the raw URL to your `devfile.yml` in Gitea repository by clicking on the file and then on the 'Raw' button
- Once the content of the devfile is loaded click on 'Create & Open' at the buttom
- Give the workspace containers some time to spin up  

Have a good look around the UI, it should look familiar if you have ever worked with VSCode and the like. To prepare the Workspace for developing with OpenShift, run the following steps:

- In the CRW shortcuts menu to the right ("cube icon")
  - Run **install oc**
  - Run **install odo**
- Close the tabs the installation opened.
