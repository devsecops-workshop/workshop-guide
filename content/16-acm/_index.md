+++
title = "Advanced Cluster Management"
weight = 40
+++

## Advanced Cluster Management Overview

Red Hat Advanced Cluster Management for Kubernetes (ACM) provides management, visibility and control for your OpenShift and Kubernetes environments. It provides management capabilities for:

- cluster creation
- application lifecycle
- security and compliance

All across hybrid cloud environments.

Clusters and applications are visible and managed from a single console, with built-in security policies. Run your operations from anywhere that Red Hat OpenShift runs, and manage any Kubernetes cluster in your fleet.

## Install Advanced Cluster Managagement

Before you can start using ACM, you have to install it using an Operator on your OpenShift cluster.

- Login to the OpenShift Web Console with you cluster admin credentials
- In the Web Console, go to **Operators > OperatorHub** and search for the `Advanced Cluster Management for Kubernetes` operator.
- Install the operator with the default settings
- It will install into a new **Project** `open-cluster-management` by default.

After the operator has been installed it will inform you to create a `MultiClusterHub`, the central component of ACM.

{{< figure src="../images/acm-install1.png?width=30pc&classes=border,shadow" title="Click image to enlarge" >}}

Click the **Create MultiClusterHub** button and have a look at the available installation parameters, but don't change anything.

Click **Create**.

At some point you will be asked to refresh the web console. Do this, you'll notice a new drop-down menu at the top of the left menu bar. If left set to `local-cluster` you get the standard console view, switching to `All Clusters` takes you to a view provided by ACM covering all your clusters.

Okay, right now you'll only see one, your `local-cluster` listed here.

## A first look at Advanced Cluster Management

Now let's change to the full ACM console:

- Switch back to the `local-clusters` view
- Go to **Operators**->**Installed operators** and click the **Advanced Cluster Management for Kubernetes** operator
- In the operator overview page choose the **MultiClusterHub** tab.
- The `multiclusterhub` instance you deployed should be in **Status** `Running` by now.
- Look up the route for the `multicloud-console` and access it.
- Click the **Log in with OpenShift** button and login with your OpenShift account.

You are now in your ACM dashboard!

{{< figure src="../images/acm-dashboard.png?width=70pc&classes=border,shadow" title="Click image to enlarge" >}}

Have a look around:

- Go to **Infrastructure**->**Clusters**
- You'll see your lab OpenShift cluster here, the infrastructure it's running on and the version.
  - There might be a version update available, don't run it please... ;)
- If you click the cluster name, you'll get even more information, explore!

## Manage Cluster Lifecycle

One of the main features of Advanced Cluster Management is cluster lifecycle management. ACM can help to:

- manage credentials
- deploy clusters to various cloud providers and on-premises
- import existing clusters
- use labels on clusters for management purposes

Let's give this a try!

## Deploy an OpenShift Cluster

Okay, do not overstress our cloud ressources and for the fun of it we'll deploy a Single Node OpenShift (SNO) cluster to the same AWS account your lab cluster is running in.

### Create Cloud Credentials

The first step is to create credentials in ACM to deploy to the Amazon Web Services account.

{{% notice tip %}}
You'll get the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` needed to deploy to AWS from your facilitators.
{{% /notice %}}

- On your OpenShift cluster, create a new namespace `sno`
- In the ACM web console, navigate to **Credentials** and click **Add credential**:
  - As **Credential type** select `AWS`
  - **Credential name**: sno
  - **Namespace**: Choose the `sno` namespace
  - **Base DNS domain**: `sandbox<NNNN>.opentlc.com`, replace `<NNNN>` with your id, you can find it e.g. in the URL
  - Click **Next**
  - Now you need to enter the AWS credentials, enter the `Access key ID` and `Secret access key` as provided.
  - Click **Next**
  - Click **Next** again for proxy settings
  - Now you need to enter an OpenShift Pull Secret, copy it from your OpenShift cluster:
    - Switch to the project `openshift-config` and copy the content of the secret `pull-secret`
  - To connect to the managed SNO you need to enter a SSH private key (`$HOME/.ssh/<LABID>key.pem`) and public key (`$HOME/.ssh/<LABID>key.pub`).
    - Use the respective keys from your lab environments bastion host, the access details will be provided.
    - The `<LABID>` can be found in the URL, e.g. multicloud-console.apps.cluster-**z48z9**.z48z9.sandbox910.opentlc.com
  - Click **Next**
  - Click **Add**

You have created a new set of credentials to deploy to the AWS account you are using.

## Deploy Single Node OpenShift

Now you'll deploy a new OpenShift instance:

- In the ACM console, navigate to **Infrastructure** -> **Clusters** and click **Create cluster**.
- As provider choose **Amazon Web Services**
- **Infrastructure provider credential**: Select the `sno` credential you created.
- **Cluster name**: aws-sno
- **Cluster set**: Leave empty ...
- **Base DNS Domain**: Set automatically from the credentials
- **Release name**: Use the latest **4.10** release available
- **Additional Label**: sno=true
- Click **Next**
- On the Node pools view leave the **Region** set to `us-east-1`
- **Architecture**: amd64
- Expand **Control plane pool**
  - read the information for **Zones** (and leave the setting empty)
  - change **Instance Type** to `m5.2xlarge`.
- Expand **Worker pool 1**:
  - Set **Node count** to `0` (we want a single node OCP...).
- Click **Next**
- Have a look at the network screen but don't change anything

Now click **Next** until you arrive at the **Review**. Do the following:

- Set `YAML: On`
- In the **cluster YAML** editor select the **install-config** tab
- In the `controlPlane` section change the `replicas` field to `1`.

It's time to deploy your cluster, click **Create**!

ACM monitors the installation of the new cluster and finally imports it. Click **View logs** under **Cluster install** to follow the installation log.

{{% notice tip %}}
Installation of a SNO takes around 30 minutes in our lab environment.
{{% /notice %}}

After the installation has finished, access the **Clusters** section in the ACM portal again.

{{< figure src="../images/acm-clusters.png?width=70pc&classes=border,shadow" title="Click image to enlarge" >}}

Explore the information ACM is providing, including the Console URL and the access credentials of your shiny new SNO instance. Use them to login to the SNO Web Console.

## Application Lifecycle Management

In the previous lab, you explored the Cluster Lifecycle functionality of RHACM by deploying a new OpenShift single-node instance to AWS. Now let's have a look at another capability, Application Lifecycle management.

Application Lifecycle management is used to manage applications on your clusters. This allows you to define a single or multi-cluster application using Kubernetes specifications, but with additional automation of the deployment and lifecycle management of resources to individual clusters. An application designed to run on a single cluster is straightforward and something you ought to be familiar with from working with OpenShift fundamentals. A multi-cluster application allows you to orchestrate the deployment of these same resources to multiple clusters, based on a set of rules you define for which clusters run the application components.

The naming convention of the different components of the Application Lifecycle model in RHACM is as follows:

- **Channel**: Defines a place where deployable resources are stored, such as an object store, Kubernetes namespace, Helm repository, or GitHub repository.
- **Subscription**: Definitions that identify deployable resources available in a Channel resource that are to be deployed to a target cluster.
- **PlacementRule**: Defines the target clusters where subscriptions deploy and maintain the application. It is composed of Kubernetes resources identified by the Subscription resource and pulled from the location defined in the Channel resource.
- **Application**: A way to group the components here into a more easily viewable single resource. An Application resource typically references a Subscription resource.

## Creating a Simple Application with ACM

Start with adding labels to your two OpenShift clusters in your ACM console:

- On the local cluster add a label: `environment=prod`
- On the new SNO deployment add label: `environment=dev`

{{< figure src="../images/acm-application1.png?width=60pc&classes=border,shadow" title="Click image to enlarge" >}}

Now it's time to actually deploy the application. But first have a look at the manifest definitions ACM will use as deployables at https://github.com/devsecops-workshop/book-import/tree/master/book-import.

Then in the ACM console navigate to **Applications**:

- Click **Create application**, select **Subscription**
- Make sure the view is set to YAML
- **Name**: book-import
- **Namespace**: book-import
- Under **Repository location for resources** -> **Repository types**, select `GIT`
- **URL**: https://github.com/devsecops-workshop/book-import.git
- **Branch**: master
- **Path**: book-import
- Select **Deploy application resources only on clusters matching specified labels**
- **Label**: environment
- **Value**: dev

{{< figure src="../images/acm-application2.png?width=20pc&classes=border,shadow" title="Click image to enlarge" >}}

Click **Create**, after a few minutes you will see the application available in ACM. Click the application and have a look at the topology view:

{{< figure src="../images/acm-application3.png?width=20pc&classes=border,shadow" title="Click image to enlarge" >}}

- Select **Cluster**, the application should have been deployed to the SNO cluster because of the label `environment=dev`
- Select the **Route** and click on the URL, this should take you to the Book Import application
- Explore the other objects

Now edit the application in the ACM console and change the label to `environment=prod`. What happens?

In this simple example you have seen how to deploy an application to an OpenShift cluster using ACM. All manifests defining the application where kept in a Git repo, ACM then used the manifests to deploy the required objects into the target cluster.

## Pre/Post Tasks with Ansible Automation Platform 2

You can integrate Ansible Automation Platform and the Automation Controller (formerly known as Ansible Tower) with ACM to perform pre / post tasks within the application lifecycle engine. The prehook and posthook task allows you to trigger an Ansible playbook before and after the application is deployed, respectively.

### Install Automation Controller

To give this a try you need an Automation Controller instance. So let's deploy one on your cluster using the AAP Operator:

- In OperatorHub search for the `Ansible Automation Platform` operator and install it using the default settings.
- After installation has finished create an Automation Controller instance using the Operator, name it `automationcontroller`
- When the instance is ready, look up `automationcontroller-admin-password` secret
- Then look up the `automationcontroller` route, access it and login as user `admin` using the password from the secret
- Apply a manifest or use the username/password login to the Red Hat Customer Portal and add a subscription

You are now set with a shiny new Ansible Automation Platform Controller!

### Add Auth Token

In the Automation Controller web UI, generate a token for the admin user:

- Go to **Users**
- Click `admin` and select **Tokens**
- Click the **Add** button
- As description add `Token for use by ACM`
- Update the **Scope** to `Write`
- Click **Save**

Save the token value to a text file, you will need this token later!

### Configure Template in Automation Controller

For Automation Controller to run something we must configure a Project and a Template first.

Create an Ansible Project:

- Select **Projects** in the left menu
- Click **Add**
- **Name**: ACM Test
- **Organization**: Default
- **SCM Type**: Git
- **SCM URL**: https://github.com/devsecops-workshop/ansible-acm.git
- Click **Save**

Create an Ansible Job Template:

- Select **Templates** in the left menu.
- Click **Add** then **Add Job Template**
- **Name**: acm-test
- **Inventory**: Demo Inventory
- **Project**: ACM Test
- **Playbook**: message.yml
- Check **Prompt on launch** for **Variables**
- Click **Save**
- Click **Launch**

Verify that the Job run by going to **Jobs** and looking for an `acm-test` job showing a successful Playbook run.

### Create AAP credentials in ACM

Set up the credential which is going to allow ACM to interact with your AAP instance in your ACM Portal:

- Click on **Credentials** on the left menu and select **Add Credential** button.
- **Credential type**: Red Hat Ansible Automation Platform
- **Credential name**: appaccess
- **Namespace**: open-cluster-management
- Click **Next**
- **Ansible Tower Host**: <Automation Controller instance URL>
- **Ansible Tower token**: <admin user token you generated earlier>
- Click **Next** and **Add**

### Use the ACM - Ansible integration

And now let's configure the ACM integration with Ansible Automation Platform to kick off a job in Automation Controller. In this case the Ansible job will just run our simple playbook that will only output a message.

In the ACM Portal:

- Go to the **Applications** menu on the left and click **Create application → Subscription**
- Enter the following information:
  - **Name**: book-import2
  - **Namespace**: book-import2
- Under **repository types**, select **GIT repository**
- **URL**: https://github.com/devsecops-workshop/book-import.git
- **Branch**: prehook
- **Path**: book-import
- Expand the **Configure automation for prehook and posthook** dropdown menu
- **Ansible Automation Platform credential**: appaccess
- Select **Deploy application resources only on clusters matching specified labels**
- **Label**: environment
- **Value**: dev
- Click **Create**

Give this a few minutes. The application will complete and in the application topology view you will see the Ansible prehook. In Automation Controller go to **Jobs** and verify the Automation Job run.
