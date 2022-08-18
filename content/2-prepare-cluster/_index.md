+++
title = "Prepare Cluster"
weight = 5
+++

## Cluster Preparation

Before you start you have to install a good number of components you'll use during the workshop. The first one is `OpenShift Data Foundation` for providing storage. We'll start with it because the install takes a fair amount of time.

Number two and three are `Gitea` for providing Git services in your cluster and `Red Hat OpenShift Dev Spaces` as development environment. And last but not least we'll add `Red Hat Quay` as a secure, private container registry.

But fear not, all are managed by Kubernetes [Operators](https://cloud.redhat.com/learn/topics/operators) on OpenShift.

## Install `OpenShift Data Foundation`

Let's install `OpenShift Data Foundation` which you might know under the old name `OpenShift Container Storage`. It is engineered as the data and storage services platform for OpenShift and provides software-defined storage for containers.

- Login to the OpenShift Webconsole with you cluster admin credentials
- In the Web Console, go to **Operators > OperatorHub** and search for the `OpenShift Data Foundation` operator
- Install the operator with default settings

After the operator has been installed it will inform you to install a `StorageSystem`. From the operator overview page click `Create StorageSystem` with the following settings:
- **Backing storage**: Leave `Deployment Type` `Full deployment` and for `Backing storage type` make sure `gp2` is selected.
- Click **Next**
- **Capacity and nodes**: Leave the `Requested capacity` as is (2 TiB) and select all nodes.
- Click **Next**
- **Security and network**: Leave set to `Default (SDN)`
- Click **Next**

 You'll see a review of your settings, hit `Create StorageSystem`

 As mentioned already this takes some time so go ahead and install the other prerequisites. We'll come back later.

## Install and Prepare Gitea

We'll need Git repository services to keep our app and infrastructure source code, so let's just install trusted `Gitea` using an operator:

{{% notice tip %}}
[Gitea](https://gitea.io/en-us/) is an OpenSource Git Server similar to GitHub. A team at Red Hat was so nice to create an Operator for it. This is a good example of how you can integrate an operator into your catalog that is not part of the default [OperatorHub](https://operatorhub.io/) already.
{{% /notice %}}

- If you don't already have the oc client installed, you can download the matching version for your operating system [here](https://mirror.openshift.com/pub/openshift-v4/clients/ocp/stable/)
- Login to the OpenShift Webconsole with you cluster admin credentials
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

**OpenShift Dev Spaces** is a browser-based IDE for Cloud Native Development. All the heavy lifting is done though a container running your workpsace on OpenShift. All you really need is a laptop. You can easily switch and setup customized environment, plugin, build tools and runtimes. So switching from one project context to another is as easy a switching a website. No more endless installation and configuration marathons on your dev laptop. It is already part of your OpenShift subscription. If you want to find out more have a look [here]{https://developers.redhat.com/products/openshift-dev-spaces/overview}

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
- Copy the **raw URL** of the `devfile_v2.yml` file in your `Gitea` repository by clicking on the file and then on the **Raw** button (or **Originalversion** in German).
- Paste the full URL into the **Git Repo URL** field and click **Create & Open**
  ![Gitea](../images/crw.png)
- You'll get into the **Starting workspace ...** view, give the workspace containers some time to spin up.

When your workspace has finally started, have a good look around in the UI. It should look familiar if you have ever worked with VSCode or similar IDEs.

{{% notice tip %}}
When working with Dev Spaces make sure you have AdBlockers disabled, you are not on a VPN and a have good internet connection to ensure a stable setup. If you are facing any issues try to reload the Browser window. If that doesn't help restart the workspace in the main Dev Spaces site under **Workspaces** and then menu **Restart Workspace**
{{% /notice %}}

## Check `OpenShift Data Foundation (ODF)` Storage Deployment

Now it's time to check if the `StorageSystem` deployment from ODF completed succesfully. In the openShift web console:

- Open **Storage->DataFoundation**
- On the overview page go to the **Storage Systems** tab
- Click **ocs-storagecluster-storagesystem**
- On the next page make sure the status indicators on the **Block and File** and **Object** tabs are **green**!

Your container storage is ready to go, explore the information on the overview pages if you'd like.

## Install Red Hat Quay Container Registry

Now that we got most of the cluster preparation out of the way it's time for the last preparation step. We want to replace the internal OpenShift Registry with Red Hat Quay, a security-focussed and scalable private registry platform.

Quay installation is done through an operator, too:

- In **Operators->OperatorHub** filter for `Quay`
- Install the **Red Hat Quay** operator with default settings
- Create a new namespace `quay`
- In the namespace go to **Administration->LimitRanges** and delete the `quay-core-resource-limits`
- In the operator overview of the Quay Operator on the **Quay Registry** tile click **Create instance**
- In the next form make sure you are in the `quay` project
- Change the name to `quay`
- Click **Create**
- Click the new registry, scroll down to **Conditions** and wait until the **Available** type changes to `True`

Now that the Registry is installed you have to configure a superuser:

- Make sure you are in the `quay` Project
- Go to **Networking->Routes**, access the Quay portal using the first route (`quay-quay`)
- Click **Create Account**
  - As username put in `quayadmin`, a (fake) email address and a password.
- Click **Create Account** again
- In the OpenShift web console open **Workloads->Secrets**
- Search for `quay-config-editor`, open the secret and copy the values, you'll need them in a second.
- Go back to the **Routes** and open the `quay-quay-config-editor` route
- Login with the values of the secret from above
- Click **Sign in**
- Scroll down to **Access Settings**
- As **Super User** but in `quayadmin`
- click **Validate Configuration Changes** and after the validation click **Reconfigure Quay**

Reconfiguring Quay takes some time. The easiest way to determine if it's been finished is to open the Quay portal (using the `quay-quay` Route). At the upper right you'll see the username (`quayadmin`), if you click the username the drop-down should show a link **Super User Admin Panel**. When it shows up you can proceed.

## Integrate Quay as Registry into OpenShift

To replace the internal default OpenShift Registry with the Quay Registry, **Quay Bridge** is used.

- In the OperatorHub of your cluster, search for the **Quay Bridge** Operator
- Install it with default settings
- While the Operator is installing, create a new Organization in Quay:
  - Access the Quay Portal
  - Click **Create New Organization**
    - Name it `openshift_integration`
  - Click **Create Organization** again

We need an Oauth Application in Quay for the integration:

  - In the Quay Portal, click the **Applications** icon in the menubar to the left
  - Click **Create New Application** at the upper right
    - Name it `openshift` and click it
  - In the menubar to the left click the **Generate Token** icon
    - Check all boxes and click **Generate Access token**
    - In the next view click **Authorize Application** and confirm
    - In the next view copy the **Access Token** and save it somewhere, we'll need it again

Now we finally create an Quay Bridge instance. In the OpenShift web console make sure you are in the `quay` Project. Then:

- Create a new Secret
  - Go to **Workloads->Secrets** and click **Create->Key/value secret**
    - **Secret name**: quay-credentials
    - **Key**: token
    - **Value**: paste the Access Token you generated in the Quay Portal before
    - Click **Create**

- Go to the Red Hat Quay Bridge Operator overview
- On the **Quay Integration** tile click **Create Instance**
  - Open **Credentials secret**
    - **Namespace**: `quay`
    - **Key within the secret**: `token`
  - Copy the Quay Portal hostname (including `https://`) and paste it into the **Quay Hostname** field
  - Set **Insecure registry** to `true`

And you are done with the installation and integration of Quay as your registry! Test if the integration works:

- In the Quay Portal you should see your Openshift Projects are synced and represented as Quay Organizations, prefixed with `openshift_`.
  - E.g. there should be a `openshift_git` Quay Organization.
- In the OpenShift web console create a new test Project, make sure it's synced to Quay as an Organization and delete it again.













Your cluster is now prepared for the next step, proceed to the **Inner Loop**.
