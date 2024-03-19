+++
title = "Install Prerequisites"
weight = 5
+++

## Install Prerequisites

During this workshop you'll install and use a good number of software components. The first one is `OpenShift Data Foundation` for providing storage. We'll start with it because the install takes a fair amount of time. Number two is `Gitea` for providing Git services in your cluster with more to follow in subsequent chapters.

But fear not, all are managed by Kubernetes [Operators](https://cloud.redhat.com/learn/topics/operators) on OpenShift.

## Install OpenShift Data Foundation

Let's install [OpenShift Data Foundation](https://www.redhat.com/en/technologies/cloud-computing/openshift-data-foundation) which you might know under the old name `OpenShift Container Storage`. It is engineered as the data and storage services platform for OpenShift and provides software-defined storage for containers.

- Login to the OpenShift Webconsole with your cluster admin credentials
- In the Web Console, go to **Operators > OperatorHub** and search for the `OpenShift Data Foundation` operator
  {{< figure src="../images/odf-operator.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
- Install the operator with default settings

After the operator has been installed it will inform you to install a `StorageSystem`. From the operator overview page click `Create StorageSystem` with the following settings:

- **Backing storage**: Leave `Deployment Type` `Full deployment` and for `Backing storage type` make sure `gp2` is selected.
- Click **Next**
- **Capacity and nodes**: Leave the `Requested capacity` as is (2 TiB) and select all nodes.
- Click **Next**
- **Security and network**: Leave set to `Default (SDN)`
- Click **Next**

You'll see a review of your settings, hit `Create StorageSystem`. Don't worry if you see a temporary _404 Page_. Just releod the browser page once and you will see the System Overview

{{< figure src="../images/odf-systems.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

As mentioned already this takes some time, so go ahead and install the other prerequisites. We'll come back later.

## Prepare to run oc commands

You will be asked to run `oc` (the OpenShift commandline tool) commands a couple of times. We will do this by using the **OpenShift Web Terminal**. This is the easiest way because you don't have to install `oc` or an SSH client.

### Install OpenShift Web Terminal

To extend OpenShift with the Web Terminal option, install the **Web Terminal** operator:

- Login to the OpenShift Webconsole with your cluster admin credentials
- In the Web Console, go to **Operators > OperatorHub** and search for the **Web Terminal** operator
- Install the operator with the default settings

This will take some time and installs another operator as a dependency.

After the operator has installed, reload the OCP Web Console browser window. You will now have a new button (**>\_**) in the upper right. Click it to start a new web terminal. From here you can run the `oc` commands when the lab guide requests it (copy/paste might depend on your laptop OS and browser settings, e.g. try `Ctrl-Shift-V` for pasting).

{{< figure src="../images/web-terminal.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

{{% notice warning %}}
The terminal is not persistent, so if it was closed for any reason anything you did in the terminal is gone after re-opening.
{{% /notice %}}

If for any reason you can't use the webterminal, your options are:

- Install and run `oc` on your laptop
- SSH into the bastion host, if running on a Red Hat RHDP lab environment. From here you can just run `oc` without login.

TODO: Change yaml applies to direct git download

## Install and Prepare Gitea

We'll need Git repository services to keep our app and infrastructure source code, so let's just install trusted `Gitea` using an operator:

{{% notice tip %}}
[Gitea](https://gitea.io/en-us/) is an OpenSource Git Server similar to GitHub. A team at Red Hat was so nice to create an Operator for it. This is a good example of how you can integrate an operator into your catalog that is not part of the default [OperatorHub](https://operatorhub.io/) already.
{{% /notice %}}

To integrate the `Gitea` operator into your Operator catalog you need to access your cluster with the `oc` client. You can do this in two ways:

- If you don't already have the oc client installed, you can download the matching version for your operating system [here](https://mirror.openshift.com/pub/openshift-v4/clients/ocp/stable/)
- Login to the OpenShift Web Console with you cluster admin credentials
- On the top right click on your username and then **Copy login command** to copy your login token
- On you local machine open a terminal and login with the `oc` command you copied above, you may need to add **--insecure-skip-tls-verify** at the end of the line

Or, if working on a Red Hat RHPDS environment:

- Use the information provided to login to your bastion host via SSH
- When logged in as `lab-user` you will be able to run `oc` commands without additional login.

Now using `oc` add the Gitea Operator to your OpenShift OperatorHub catalog:

```
oc apply -f https://raw.githubusercontent.com/rhpds/gitea-operator/ded5474ee40515c07211a192f35fb32974a2adf9/catalog_source.yaml
```

- In the Web Console, go to **Operators > OperatorHub** and search for `Gitea` (You may need to disable search filters)
- Install the `Gitea Operator` with default settings
- Go to **Installed Operators > Gitea Operator**
- Create a new OpenShift **project** called `git` with the Project selection menu at the top
  TODO : Screenshot
- Make sure you are in the `git` project via the top Project selection menu !
- Click on **Create new instance** ( while in project `git`)

<!-- ![Gitea](../images/gitea.png) -->

{{< figure src="../images/gitea.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
TODO : Replace Screenshot

- On the **Create Gitea** page switch to the YAML view and add the following `spec` values :

```
spec:
  giteaAdminUser: gitea
  giteaAdminPassword: "gitea"
  giteaAdminEmail: opentlc-mgr@redhat.com
```

- Click **Create**

After creation has finished:

- Access the route URL (you'll find it e.g. in **Networking > Routes > repository > Location**). If the Route is not yet there just wait a couple of minutes.
- This will take you to the Gitea web UI
- Sign-In to `Gitea` with user `gitea` and password `gitea`
- If your Gitea UI appears in a language other then English (depending on your locale settings), switch it to English. Change the language in your Gitea UI, the example below shows a German example:

|                                                                                                                |                                                                                                                |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| {{< figure src="../images/gitea-lang1.png?width=10pc&classes=border,shadow" title="Click image to enlarge" >}} | {{< figure src="../images/gitea-lang2.png?width=10pc&classes=border,shadow" title="Click image to enlarge" >}} |

## Import the Required Repositories

Now we will clone a git repository of a sample application into our Gitea, so we have some code to works with

- Clone the example repo:
  - Click the **+** dropdown and choose **New Migration**
  - As type choose **Git**
  - **URL**: https://github.com/devsecops-workshop/quarkus-build-options.git
  - Click **Migrate Repository**

In the cloned repository you'll find a `devfile.yaml`. We will need the URL to the file soon, so keep the tab open.

In later chapters we will need a second repository to hold your GitOps yaml resources. Let's create this now as well

- In `Gitea` create a **New Migration** and clone the Config GitOps Repo which will be the repository that contains our GitOps infrastructure components and state
- The URL is https://github.com/devsecops-workshop/openshift-gitops-getting-started.git

## Check OpenShift Data Foundation (ODF) Storage Deployment

Now it's time to check if the `StorageSystem` deployment from ODF completed succesfully. In the openShift web console:

- Open **Storage->DataFoundation**
- On the overview page go to the **Storage Systems** tab
- Click **ocs-storagecluster-storagesystem**
- On the next page make sure the status indicators on the **Block and File** and **Object** tabs are **green**!

{{< figure src="../images/storage-system1.png?width=40pc&classes=border,shadow" title="Click image to enlarge" >}}

{{< figure src="../images/storage-system2.png?width=45pc&classes=border,shadow" title="Click image to enlarge" >}}

Your container storage is ready to go, explore the information on the overview pages if you'd like.

## Install Red Hat Quay Container Registry

The image that we have just deployed was pushed to the internal OpenShift Registry which is a great starting point for your cloud native journey. But if you require more control over you image repos, a graphical GUI, scalability, internal security scanning and the like you may want to upgrade to **Red Hat Quay**. So as a next step we want to replace the internal registry with Quay.

Quay installation is done through an operator, too:

- In **Operators->OperatorHub** filter for `Quay`
- Install the **Red Hat Quay** Operator with the default settings
- Create a new project called `quay` at the top Project selection menu
- While in the project `quay` go to **Administration->LimitRanges** and delete the `quay-core-resource-limits`
  {{< figure src="../images/delete-limit-range.png?width=45pc&classes=border,shadow" title="Click image to enlarge" >}}
- In the operator overview of the Quay Operator on the **Quay Registry** tile click **Create instance**
- If the _YAML view_ is shown switch to _Form view_
- Make sure you are in the `quay` project
- Change the name to `quay`
- Click **Create**
- Click the new Quayregistry, scroll down to **Conditions** and wait until the **Available** type changes to `True`
  {{< figure src="../images/quay-available.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

Now that the Registry is installed you have to configure a superuser:

- Make sure you are in the `quay` Project
- Go to **Networking->Routes**, access the Quay portal using the URL of the first route (`quay-quay`)
- Click **Create Account**
  - As username put in `quayadmin`, a (fake) email address and and `quayadmin` as password.
- Click **Create Account** again
- In the OpenShift Web Console open **Workloads->Secrets**
- Search for `quay-config-editor-credentials-...`, open the secret and copy the values, you'll need them in a second.
- Go back to the **Routes** and open the `quay-quay-config-editor` route
- Login with the values of the secret from above
- Click **Sign in**
- Scroll down to **Access Settings**
- As **Super User** put in `quayadmin`
- click **Validate Configuration Changes** and after the validation click **Reconfigure Quay**

Reconfiguring Quay takes some time. The easiest way to determine if it's been finished is to open the Quay portal (using the `quay-quay` Route). At the upper right you'll see the username (`quayadmin`), if you click the username the drop-down should show a link **Super User Admin Panel**. When it shows up you can proceed.

{{< figure src="../images/quay-superuser.png?width=15pc&classes=border,shadow" title="Click image to enlarge" >}}

## Integrate Quay as Registry into OpenShift

To synchronize the internal default OpenShift Registry with the Quay Registry, **Quay Bridge** is used.

- In the OperatorHub of your cluster, search for the **Quay Bridge** Operator
  - Install it with default settings

Now we finally create an **Quay Bridge** instance. :

- Go to the Red Hat **Quay Bridge** Operator overview (make sure you are in the `quay` namespace)
- On the **Quay Integration** tile click **Create Instance**
  - Open **Credentials secret**
    - **Namespace containing the secret**: `quay`
    - **Key within the secret**: `token`
  - Copy the Quay Portal hostname (including `https://`) and paste it into the **Quay Hostname** field
  - Set **Insecure registry** to `true`
  - Click **Create**

## Architecture recap

{{< figure src="../images/workshop_architecture_prepare.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
