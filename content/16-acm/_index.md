+++
title = "Advanced Cluster Management"
weight = 40
+++

## Advanced Cluster Management Overview

Red Hat Advanced Cluster Management for Kubernetes (ACM) provides management, visibility and control for your OpenShift and Kubernetes environments. It provides management capabilities for:

* cluster creation
* application lifecycle
* security and compliance

All across hybrid cloud environments.

Clusters and applications are visible and managed from a single console, with built-in security policies. Run your operations from anywhere that Red Hat OpenShift runs, and manage any Kubernetes cluster in your fleet.

## Install Advanced Cluster Managagement

Before you can start using ACM, you have to install it using an Operator on your OpenShift cluster.

- Login to the OpenShift Webconsole with you cluster admin credentials
- In the Web Console, go to **Operators > OperatorHub** and search for the `Advanced Cluster Management for Kubernetes` operator.
- Install the operator with default settings
- It will install into a new **Project** `open-cluster-management` by default.

After the operator has been installed it will inform you to create a `MultiClusterHub`, the central component of ACM.


{{< figure src="../images/acm-install1.png?width=30pc&classes=border,shadow" title="Click image to enlarge" >}}

Click the **Create MultiClusterHub** button and have a look at the available installation parameters, but don't change anything.

{{% notice tip %}}
Take note of the `Disable Hub Self Management` option. Leaving this set to `false` will add the cluster ACM is installed on as a managed cluster to ACM. You might not want this if you have a dedicated management cluster, for this lab leave as is.
{{% /notice %}}

Click **Create**.

At some point you will be asked to refresh the web console. Do this, you'll notice a new drop-down menu at the top of the left menu bar. If left set to `local-cluster` you get the standard console view, switching to `All Clusters` takes you to a view provided by ACM covering all your clusters.

Okay, right now you'll only see one, your `local-cluster` listend here.

## A first look at Advanced Cluster Management

Now let's change to the full ACM console:

* Switch back to the `local-clusters` view
* Go to **Operators**->**Installed operators** and click the **Advanced Cluster Management for Kubernetes** operator
* In the operator overview page choose the **MultiClusterHub** tab.
* The `multiclusterhub` instance you deployed should be in **Status** `Running` by now.
* Look up the route for the `multicloud-console` and access it.
* Click the **Log in with OpenShift** button and login with your OpenShift account.

You are now in your ACM dashboard!

{{< figure src="../images/acm-dashboard.png?width=70pc&classes=border,shadow" title="Click image to enlarge" >}}

Have a look around:

* Go to **Infrastructure**->**Clusters**
* You'll see your lab OpenShift cluster here, the infrastructure it's running on and the version.
  * There might be a version update available, don't run it please... ;)
* If you click the cluster name, you'll get even more information, explore!

## Manage Cluster Lifecycle

One of the main features of Advanced Cluster Management is cluster lifecycle management. ACM can help to:

* manage credentials
* deploy clusters to different cloud providers and on-premise
* import existing clusters
* use labels on clusters for management purposes

Let's give this a try!

## Deploy a Single Node OpenShift

To not overstress our cloud ressources and for the fun of it we'll deploy a Single Node OpenShift to the same AWS account your lab cluster is running in.

### Create Cloud Credentials

The first step is to create credentials in ACM to deploy to the Amazon Web Services account.

{{% notice tip %}}
You'll get the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` needed to deploy to AWS from your facilitators.
{{% /notice %}}

* On your OpenShift cluster, create a new namespace `sno`
* In the ACM web console, navigate to **Credentials** and click **Add credential**:
  * As **Credential type** select `AWS`
  * **Credential name**: sno
  * **Namespace**: Choose the `sno` namespace
  * **Base DNS domain**: `sandbox<NNNN>.opentlc.com`, replace `<NNNN>` with your id, you can find it e.g. in the URL
  * Click **Next**
  * Now you need to enter the AWS credentials, enter the `Access key ID` and `Secret access key` as provided.
  * Click **Next**
  * Click **Next** again for proxy settings
  * Now you need to enter an OpenShift Pull Secret, copy it from your OCP cluster:
    * Switch to the project `openshift-config` and copy the content of the secret `pull-secret`
  * To connect to the managed SNO you need to enter a SSH private key (`$HOME/.ssh/${GUID}key.pem`) and public key (`$HOME/.ssh/${GUID}key.pub`).
    * Use the respective keys from your lab environments bastion host, the access details will be provided.
  * Click **Next**
  * Click **Add**

You have created a new set of credentials to deploy to the AWS account you are using.

## Deploy Single Node OpenShift

Now you'll deploy a new OpenShift instance:

* In the ACM console, navigate to **Infrastructure** -> **Clusters** and click **Create cluster**.
* As provider choose **Amazon Web Services**
* **Infrastructure provider credential**: Select the `sno` credential you created.
* **Cluster name**: aws-sno
* **Cluster set**: none
* **Base DNS Domain**: Set automatically from the credentials
* **Release name**: Use the latest release available
* **Additional Label**: sno=true
* Click **Next**
* On the Node pools view leave the **Region** set to `us-east-1`
* **Architecture**: amd64
* Expand **Control plane pool**
  * read the information for **Zones** (and leave the setting empty)
  * change **Instance Type** to `m5.2xlarge`.
* Expand **Worker pool 1**:
  * Set **Node count** to `0` (we want a single node OCP...).
* Click **Next**
* Have a look at the network screen but don't change anything

Now click **Next** until you arrive at the **Review**. Do the following:

* Set `YAML: On`
* In the **cluster YAML** editor select the **install-config**
* In the `controlPlane` section change the `replicas` field to `1`.

It's time to deploy your cluster, click **Create**!

ACM monitors the installation of the new cluster and finally imports it. Click **View logs** under **Cluster install** to follow the installation log.

{{% notice tip %}}
Installation of a SNO take around 30 minutes in our lab environment.
{{% /notice %}}

After installation has finished, access the **Clusters** section in the ACM portal again.

{{< figure src="../images/acm-clusters.png?width=70pc&classes=border,shadow" title="Click image to enlarge" >}}

Explore the information ACM is providing,including the Console URL and the access credentials of your shiny new SNO instance. Use them to login to the SNO console.
