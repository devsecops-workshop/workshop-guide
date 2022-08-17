+++
title = "Prepare Cluster"
weight = 5
+++

## Cluster Preparation

Before you start you have to install a number of components you'll use during the workshop. The first two are `Gitea` for providing Git services in your cluster and `CodeReady Workspaces` as development environment. But fear not, both are managed by Kubernetes [operators](https://cloud.redhat.com/learn/topics/operators) on OpenShift.

## Install and Prepare Gitea

We'll need Git repository services to keep our app and infrastructure source code, so let's just install trusted `Gitea` using an operator:

{{% notice tip %}}
[Gitea](https://gitea.io/en-us/) is an OpenSource Git Server similar to GitHub. A team at Red Hat was so nice to create an Operator for it. This is a good example of how you can integrate an operator into your catalog that is not part of the default [OperatorHub](https://operatorhub.io/) already.
{{% /notice %}}

- If you don't already have the oc client installed, you can download the matching version for your operating system [here](https://mirror.openshift.com/pub/openshift-v4/clients/ocp/stable/)
- Log into your OpenShift Webconsole with you cluster admin credentials
- On the top right click on your username and then **Copy login command** to copy your login token
- On you local machine open a terminal log in with the `oc` command you copied
- Now using `oc` add the Gitea Operator to your OpenShift OperatorHub catalog

```
oc apply -f https://raw.githubusercontent.com/redhat-gpte-devopsautomation/gitea-operator/master/catalog_source.yaml
```

- In the Web Console, go to **Operators > OperatorHub** and search for `Gitea` (You may need to disable search filters)
- Install the `Gitea Operator` with default settings
- Create a new OpenShift project called `git`
- Go to **Installed Operators > Gitea Operator** and click on the **Create Instance** tile in the `git` project

<!-- ![Gitea](../images/gitea.png) -->

{{< figure src="../images/gitea.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

- On the **Create Gitea** page switch to the YAML view and add the following `spec` values :

```
spec:
  giteaAdminUser: gitea
  giteaAdminPassword: "gitea"
  giteaAdminEmail: opentlc-mgr@redhat.com
```

- Click **Create**

After creation has finished:

- Access the route URL (you'll find it e.g. in **Networking > Routes > repository > Location**)
- This will take you to the Gitea web UI
- Sign-In to `Gitea` with user `gitea` and password `gitea`
- If your Gitea UI appears in a language other then English (depending on your locale settings), switch it to English. Change the language in your Gitea UI, the example below shows a German example:

|                                                                                                                |                                                                                                                |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| {{< figure src="../images/gitea-lang1.png?width=10pc&classes=border,shadow" title="Click image to enlarge" >}} | {{< figure src="../images/gitea-lang2.png?width=10pc&classes=border,shadow" title="Click image to enlarge" >}} |

- Clone the example repo:
  - Click the **+** dropdown and choose **New Migration**
  - As type choose **Git**
  - **URL**: https://github.com/devsecops-workshop/quarkus-build-options.git
  - Click **Migrate Repository**

In the cloned repository you'll find a `devfile_v2.yml`. We will need the URL to the file soon, so keep the tab open.

## Install and Prepare Red Hat OpenShift Dev Spaces

**OpenShift Dev Spaces** is a browser-based IDE for Cloud Native Development. All the heavy lifting is done though a container running your workpsace on OpenShift. All you really need is a laptop. You can easily switch and setup customized environment, plugin, build tools and runtimes. So switching from one project context to another is as easy a switching a website. No more endless installation and configuration marathons on your dev laptop. It is already part your OpenShift subscription. If you want to find out more have a look [here]{https://developers.redhat.com/products/openshift-dev-spaces/overview}

- Install the **Red Hat OpenShift Dev Spaces** Operator from OperatorHub (not the previous Codeready Workspaces versions!) with default settings
- Go to **Installed Operators -> Red Hat OpenShift Dev Spaces** and create a new instance (**Red Hat OpenShift Dev Spaces instance Specification**) using the default settings in the project `openshift-operators`
- Wait until deployment has finished. This may take a couple of minutes as several components will be deployed.
- Once the instance status is ready (You can check the YAML of the instance: `status > cheClusterRunning: Available`), look up the `devspaces` Route in the `openshift-workspaces` namespace (You may need to toggle the **Show default project** button).
- Open the link in a new browser tab, click on **Log in with OpenShift** and then choose `local` and log in with your OCP credentials
- If required allow selected permissions

{{% notice tip %}}
We could create a workspace from one of the templates that come with CodeReady Workspaces, but we want to use a customized workspace with some additionally defined plugins in a [v2 devfile](https://devfile.io/) in our git repo. With devfiles you can share a complete workspace setup and with the click of a link and you will end up in a fully configured project in your browser.  
{{% /notice %}}

- In the left click menu on **Create Workspace**
- Copy the **raw URL**of the `devfile_v2.yml` file in your `Gitea` repository by clicking on the file and then on the **Raw** button (or **Originalversion** in German).
- Paste the full URL into the **Git Repo URL** field and click **Create & Open**
  ![Gitea](../images/crw.png)
- You'll get into the **Starting workspace ...** view, give the workspace containers some time to spin up.

When your workspace has finally started, have a good look around in the UI. It should look familiar if you have ever worked with VSCode or similar IDEs.

{{% notice tip %}}
When working with Dev Spaces make sure you have AdBlockers disabled, you are not on a VPN and a have good internet connection to ensure a stable setup. If you are facing any issues try to releod the Browser window. If that doesn't help restart the workspace in the main Dev Spaces site under **Workspaces** and then menu **Restart Workspace**  
{{% /notice %}}

Your cluster is now prepared for the next step, proceed to the **Inner Loop**.
