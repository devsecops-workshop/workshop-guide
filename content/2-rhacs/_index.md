+++
title = "Install and Configure Advanced Cluster Security"
weight = 2
+++
## Install RHACS
### Install the Operator
- Install the "Advanced Cluster Security for Kubernetes" operator from OperatorHub with the default values.

### Install the main component **Central**
- Navigate to **Operators → Installed Operators**
- Select the ACS operator
- You should be in the **openshift-operator** project, create a new project **stackrox** (use the **Project** drop-down)
- Select **Provided APIs → Central → Create Central**
- Choose a name and accept the default values
- Click **Create Central**
- After deployment has finished (**Status** "Conditions: Deployed, Initialized") access the RHACS Portal to verify the installation
  -  Look up the **central-htpasswd** resource that was created to get the password
  - Look up  and access the route **central**.
- This will get you to the RHACS portal, accept the self-signed certificate and login as user **admin** with the password from the secret.

Now you have a **Central** instance that provides the following services in an
RHACS setup:

- The Red Hat Advanced Cluster Security for Kubernetes application management interface and services. It handles data persistence, API interactions, and user interface access. You can use the same Central instance to secure multiple OpenShift Container Platform or Kubernetes clusters.

- Scanner is a vulnerability scanner for  scanning container images and their associated database. It analyzes all image layers to check known vulnerabilities from the Common Vulnerabilities and Exposures (CVEs) list. Scanner also identifies vulnerabilities in packages installed by package managers and in dependencies for multiple programming languages.

To actually do and see anything you need to add a **SecuredCluster** (be it the same or another OpenShift cluster). For effect go to the **RHACS Portal**, the Dashboard should by pretty empty, click on the **Compliance** link in the menu to the left, lots of zero's and empty panels, too.

Because you don't have a monitored and secured OpenShift cluster yet.

### Prepare to add Secured Clusters

First you have to generate an init bundle which contains certificates and is used to authenticate a **SecuredCluster** to the **Central** instance, again regardless if the same cluster as the Central instance or a remote/other cluster.

In the **RHACS Portal**:

- Navigate to **Platform Configuration → Integrations**.
- Under the **Authentication Tokens** section, click on **Cluster Init Bundle**.
- Click **New Integration**
- Enter a name for the cluster init bundle and click **Generate**.
- Click **Download Kubernetes Secret File** to download the generated bundle.

The init bundle needs to be applied on all OpenShift clusters you want to secure & monitor.

### Prepare the Secured Cluster
For this workshop we run **Central** and **SecuredCluster** on one OpenShift cluster. E.g. we monitor and secure the local cluster.

**Apply the init bundle**

- Login the `oc` command to the OpenSHift cluster as `cluster-admin`.
- Switch to the **Project** you installed **ACS Central** in, it should be `stackrox`.
- Run `oc create -f <init_bundle>.yaml -n stackrox` pointing to the init bundle you downloaded from the Central instance and the Project you created.
- This will create a number of secrets:

```
secret/collector-tls created
secret/sensor-tls created
secret/admission-control-tls created
```

### Add the Cluster as **SecuredCluster** to **ACS Central**

Now you are ready to install the **SecuredClusters** instance, this will deploy the secured cluster services:

- Go to the **ACS Operator** in **Operators->Installed Operators**
- Using the Operator create an instance of the **Secured Cluster** type **in the Project you created** (should be stackrox)
- Give a name for the cluster, it'll appear under this name in the RHACS Portal
- And most importantly for **Central Endpoint**  enter the address and port number of your **RACS Portal**.
  - If the RHACS Portal is available at `https://central-stackrox.apps.cluster-65h4j.65h4j.sandbox1803.opentlc.com/` the endpoint is `central-stackrox.apps.cluster-65h4j.65h4j.sandbox1803.opentlc.com:443`.
- Under **Admission Control Settings**
  - enable **listenOnCreates** and **listenOnUpdates**
  - Set **Contact Image Scanners** to **ScanIfMissing**
- Click **Create**

Now go to your **RHACS Portal** again, after a couple of minutes you should see you secured cluster under **Platform Configuration->Clusters**. Wait until all **Cluster Status** indicators become green.

### Create a serviceaccount to scan the internal registry
To enable scanning of images in the internal registry, you'll have to add a serviceaccount and configure an **Integration**.

- Make sure you are in the `stackrox` **Project**
- **User Management -> Service account -> Create ServiceAccount**
- Check Token below
- Copy Token for login
- Give the sa the right to **read** images for all projects:

```
oc adm policy add-cluster-role-to-user 'system:image-puller' -z registry01 -n stackrox
```

oder


```
oc adm policy add-cluster-role-to-user 'system:image-puller' system:serviceaccount:stackrox:registry01 -n stackrox
```


Access the **RHACS Portal** and add an integration of type **Generic Docker Registry** from the **Platform Configuration -> Integrations menu**.

Fill in the fields:
- Give the integration a unique name that should include the cluster name
- Set **Types** to **Registry**
- Set **Endpoint** to the route you exposed for the registry
- Put in the username and token you collected above when exposing the registry
- Select Disable TLS certificate validation
- Press the test button to validate the connection and press **Save** when the test is successful.
