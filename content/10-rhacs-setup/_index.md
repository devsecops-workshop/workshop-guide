+++
title = "Install and Configure ACS"
weight = 15
+++
During the workshop you went through the OpenShift developer experience starting from software development using Quarkus and `odo`, moving on to automating build and deployment using Tekton pipelines and finally using GitOps for production deployments.

Now it's time to add another extremely important piece to the setup; enhancing application security in a conainerized world. Using the most recent addition to the OpenShift portfolio: **Red Hat Advanced Cluster Security for Kubernetes**!

## Install RHACS
### Install the Operator
- Install the "Advanced Cluster Security for Kubernetes" operator from OperatorHub with the default values.

### Install the main component **Central**
- Navigate to **Operators → Installed Operators**
- Select the ACS operator
- You are probably in the **openshift-operator** project, create a new project **stackrox** (use the **Project** drop-down)
- Select **Provided APIs → Central → Create Central**
- Change the name if you like and accept the default values
- Click **Create Central**
- After deployment has finished (**Status** "Conditions: Deployed, Initialized") access the RHACS Portal to verify the installation
  -  Look up the **central-htpasswd** secret that was created to get the password
  - Look up  and access the route **central** which was also generated automatically.
- This will get you to the RHACS portal, accept the self-signed certificate and login as user **admin** with the password from the secret.

Now you have a **Central** instance that provides the following services in an
RHACS setup:

- The application management interface and services. It handles data persistence, API interactions, and user interface access. You can use the same **Central** instance to **secure multiple** OpenShift or Kubernetes clusters.

- Scanner, which is a vulnerability scanner for  scanning container images. It analyzes all image layers to check known vulnerabilities from the Common Vulnerabilities and Exposures (CVEs) list. Scanner also identifies vulnerabilities in packages installed by package managers and in dependencies for multiple programming languages.

To actually do and see anything you need to add a **SecuredCluster** (be it the same or another OpenShift cluster). For effect go to the **RHACS Portal**, the Dashboard should by pretty empty, click on the **Compliance** link in the menu to the left, lots of zero's and empty panels, too.

Because you don't have a monitored and secured OpenShift cluster yet.

### Prepare to add Secured Clusters

First you have to generate an init bundle which contains certificates and is used to authenticate a **SecuredCluster** to the **Central** instance, again regardless if it's the same cluster as the Central instance or a remote/other cluster.

In the **RHACS Portal**:

- Navigate to **Platform Configuration → Integrations**.
- Under the **Authentication Tokens** section, click on **Cluster Init Bundle**.
- Click **Generate bundle**
- Enter a name for the cluster init bundle and click **Generate**.
- Click **Download Kubernetes Secret File** to download the generated bundle.

The init bundle needs to be applied on all OpenShift clusters you want to secure & monitor.

### Prepare the Secured Cluster
For this workshop we run **Central** and **SecuredCluster** on one OpenShift cluster. E.g. we monitor and secure the same cluster the central services live on.

**Apply the init bundle**

- Use the `oc` command to log in to the OpenShift cluster as `cluster-admin`.
  - The easiest way might be to use the **Copy login command** link from the UI
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
- Change the **Cluster Name** for the cluster if you want, it'll appear under this name in the RHACS Portal
- And most importantly for **Central Endpoint**  enter the address and port number of your **Central** instance, this is the same as the **RACS Portal**.
  - If the RHACS Portal is available at `https://central-stackrox.apps.cluster-65h4j.65h4j.sandbox1803.opentlc.com/` the endpoint is `central-stackrox.apps.cluster-65h4j.65h4j.sandbox1803.opentlc.com:443`.
- Under **Admission Control Settings**
  - enable **listenOnCreates** and **listenOnUpdates**
  - Set **Contact Image Scanners** to **ScanIfMissing**
- Click **Create**

Now go to your **RHACS Portal** again, after a couple of minutes you should see you secured cluster under **Platform Configuration->Clusters**. Wait until all **Cluster Status** indicators become green.

### Create a serviceaccount to scan the internal registry
To enable scanning of all images in the internal registry, you'll have to
-  add a serviceaccount
- assign it the needed privileges
- configure an **Integration** in ACS

**Create ServiceAccount to read images from Registry**
- Make sure you are in the `stackrox` **Project**
- **User Management -> ServiceAccounts -> Create ServiceAccount**
- Replace the example name with `acs-registry-reader` and click **Create**
- In the new ServiceAccount, under **Secrets** click the `...-token-...` secret
- Under **Data** copy the Token
- Using `oc` give the ServiceAccount the right to **read** images from all projects:

```
oc adm policy add-cluster-role-to-user 'system:image-puller' -z acs-registry-reader -n stackrox
```

or

```
oc adm policy add-cluster-role-to-user 'system:image-puller' system:serviceaccount:stackrox:acs-registry-reader -n stackrox
```
And you'll need the service address for the registry, look it up e.g. from the **Environment** of a registry pod.
  - It should be something like: `image-registry.openshift-image-registry.svc:5000`


**Add Registry Integration to ACS**

Access the **RHACS Portal** and add an integration of type **Generic Docker Registry** from the **Platform Configuration -> Integrations menu**.

Fill in the fields:
- Give the integration a unique name that should include the cluster name
- Set **Types** to **Registry**
- Set **Endpoint** to the registry service address
- Put in the ServiceAccount name as username and the token you copied above
- Select Disable TLS certificate validation
- Press the test button to validate the connection and press **Save** when the test is successful.

{{% notice tip %}}
You can also (this might be easier to maintain) just change the user and password for the exisintg, auto-generated entries for the entries `https://image-registry.openshift-image-registry.svc:5000
` and `https://image-registry.openshift-image-registry.svc.cluster.local:5000
`.
{{% /notice %}}
