+++
title = "Prepare Cluster"
weight = 5
+++

## Cluster Preparation

During this workshop you'll install and use a good number of software components. The first one is `OpenShift Data Foundation` for providing storage. We'll start with it because the install takes a fair amount of time. Number two is `Gitea` for providing Git services in your cluster with more to follow in subsequent chapters.

But fear not, all are managed by Kubernetes [Operators](https://cloud.redhat.com/learn/topics/operators) on OpenShift.

## Install OpenShift Data Foundation

Let's install [OpenShift Data Foundation](https://www.redhat.com/en/technologies/cloud-computing/openshift-data-foundation) which you might know under the old name `OpenShift Container Storage`. It is engineered as the data and storage services platform for OpenShift and provides software-defined storage for containers.

- Login to the OpenShift Webconsole with you cluster admin credentials
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

You'll see a review of your settings, hit `Create StorageSystem`

{{% notice tip %}}
Don't worry if you see a _404 Page_. The ODF Operator has just extended the OpenShift Console which may no be availabe in your current view. Just reload the browser page once and your will see the System Overview
{{% /notice %}}

{{< figure src="../images/odf-systems.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

As mentioned already this takes some time so go ahead and install the other prerequisites. We'll come back later.

## Prepare to run oc commands

You will be asked to run `oc` (the OpenShift commandline tool) commands a couple of times. We will do this by using the **OpenShift Web Terminal**. This is the easiest way because you don't have to install `oc` or an SSH client.

### Install OpenShift Web Terminal

To extend OpenShift with the Web Terminal option, install the **Web Terminal** operator:

- Login to the OpenShift Webconsole with you cluster admin credentials
- In the Web Console, go to **Operators > OperatorHub** and search for the **Web Terminal** operator
- Install the operator with default settings

This will take some time and installs another operator as dependency.

After the operator has installed, reload the OCP Web Console browser window. You will now have a new button (**>_**) in the upper right. Click it to start a new web terminal. From here you can run the `oc` commands when the lab guide requests it (copy/paste might depend on your laptop OS and browser settings, e.g. try `Ctrl-Shift-V` for pasting).

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
- Login to the OpenShift Webconsole with you cluster admin credentials
- On the top right click on your username and then **Copy login command** to copy your login token
- On you local machine open a terminal and login with the `oc` command you copied above

Or, if working on a Red Hat RHPDS environment:

- Use the information provided to login to your bastion host via SSH
- When logged in as `lab-user` you will be able to run `oc` commands without additional login.

Now using `oc` add the Gitea Operator to your OpenShift OperatorHub catalog:

```
oc apply -f https://raw.githubusercontent.com/redhat-gpte-devopsautomation/gitea-operator/master/catalog_source.yaml
```

- In the Web Console, go to **Operators > OperatorHub** and search for `Gitea` (You may need to disable search filters)
- Install the `Gitea Operator` with default settings
- Go to **Installed Operators > Gitea Operator**
- Create a new OpenShift **project** called `git` with the Project selection menu at the top
- Make sure you are in the `git` project via the top Project selection menu !
- Click on **Create new instance**

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

Now we will clone a git repository of a sample application into our Gitea, so we have some code to works with

- Clone the example repo:
  - Click the **+** dropdown and choose **New Migration**
  - As type choose **Git**
  - **URL**: https://github.com/devsecops-workshop/quarkus-build-options.git
  - Click **Migrate Repository**

In the cloned repository you'll find a `devspaces_devfile.yml`. We will need the URL to the file soon, so keep the tab open.

## Check OpenShift Data Foundation (ODF) Storage Deployment

Now it's time to check if the `StorageSystem` deployment from ODF completed succesfully. In the openShift web console:

- Open **Storage->DataFoundation**
- On the overview page go to the **Storage Systems** tab
- Click **ocs-storagecluster-storagesystem**
- On the next page make sure the status indicators on the **Block and File** and **Object** tabs are **green**!

{{< figure src="../images/storage-system1.png?width=40pc&classes=border,shadow" title="Click image to enlarge" >}}

{{< figure src="../images/storage-system2.png?width=45pc&classes=border,shadow" title="Click image to enlarge" >}}

Your container storage is ready to go, explore the information on the overview pages if you'd like.

Your cluster is now prepared for the next step, proceed to the **Inner Loop**.

## Architecture recap

{{< figure src="../images/workshop_architecture_prepare.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
