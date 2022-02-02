+++
title = "Prepare Cluster"
weight = 5
+++

## Cluster Preparation

Before you start you have to install a number of components you'll use during the workshop. The first two are `Gitea` for providing Git services in your cluster and `CodeReady Workspaces` as development environment. But fear not, both are managed by an operator.

## Install and Prepare Gitea
We'll need Git repository services, so let's just install trusted `Gitea` using an operator:

{{% notice tip %}}
This is a good example of how you can integrate an operator into your catalog that is not part of the default OperatorHub already.
{{% /notice %}}

- Log in with the `oc` command to your OpenShift cluster (the easiest way is to use the **Copy login command** link in the top right of the OCP Web Console).
- Now using `oc` add the Gitea Operator to your OpenShift OperatorHub catalog
```
oc apply -f https://raw.githubusercontent.com/redhat-gpte-devopsautomation/gitea-operator/master/catalog_source.yaml
```
- Go to OperatorHub and search for `Gitea` (You may need to disable search filters)
- Install the `Gitea Operator` with default settings
- Create a new OpenShift project called `git`
- Go to **Installed Operators -> Gitea Operator** and click **Create instance** in the `git` project
- On the **Create Gitea** page switch to the YAML view and make sure the following `spec` values are set:

```
spec:
  giteaSsl: true
  giteaAdminUser: gitea
  giteaAdminPassword: "gitea"
  giteaAdminEmail: opentlc-mgr@redhat.com
```
- Click **Create**

After creation has finished:
- On the left click on **Networking > Routes > repository > Location** 
- This will take you to the Gitea web UI
- Sign-In to Gitea with user `gitea` and password `gitea`
- Clone the example repo:
  - Click the **+** dropdown and choose **New Migration**
  - As type choose **Git**
  - **URL**: https://github.com/devsecops-workshop/quarkus-build-options.git
  - Click **Migrate Repository**

In the cloned repository you'll find a `devfile.yml`. We will need the URL to the file soon, so keep the tab open.

## Install and Prepare CodeReady Workspaces (CRW)
- Install the CRW Operator from OperatorHub (not the Tech Preview one!)
- Go to **Installed Operators -> CodeReady Workspaces** and create a new instance (CodeReady Workspaces instance Specification) using the default settings
- Wait until deployment has finished. This may take a couple of minutes as several components will be deployed. 
- Once the instance status is ready (You can check the YAML of the instance : status > cheClusterRunning: Available ), look up the `codeready` Route in the 'openshift-workspaces' namespace (You may need to toggle the **Show default project** button). 
- Open the link in a new browser tab and log in with your OCP credentials
- Apply permissions
- Enter an email, First Name and Last Name to set up your account

{{% notice tip %}}
We could create a workspace from one of the templates that come with CodeReady, but we want to use a customized workspace with some additionally defined plugins in a [v1 devfile](https://redhat-developer.github.io/devfile/) in our git repo. With devfiles you can share a complete workspace setup and with the click of a button you will end up in a fully configured project in your browser.       
{{% /notice %}}

- So at the top click on 'Custom Workspace'
- In 'Enter the devfile URL' enter the **raw URL*** to your `devfile.yml` in Gitea repository by clicking on the file and then on the **Raw** button
- Once the content of the devfile is loaded click on **Create & Open** at the buttom
- Give the workspace containers some time to spin up  

Have a good look around the UI. It should look familiar if you have ever worked with VSCode or similar IDEs. To install the `odo`cli into your workspace, run the following steps:

- In the CRW shortcuts menu to the right ("cube icon") run `install odo`
- odo cli will be downloaded and unpacked in your project folder
- Close the terminal tab the installation opened
