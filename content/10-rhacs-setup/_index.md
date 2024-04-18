+++
title = "Install and Configure ACS"
weight = 15
+++

During the workshop you went through the OpenShift developer experience starting from software development using Quarkus and **odo**, moving on to automating build and deployment using Tekton pipelines and finally using GitOps for production deployments.

Now it's time to add another extremely important piece to the setup: enhancing application security in a containerized world. Using **Red Hat Advanced Cluster Security for Kubernetes**, of course!

## Install RHACS

### RHCAS Operator

Install the **Advanced Cluster Security for Kubernetes** operator from the OperatorHub:

- Switch **Update approval** to `Manual`
- Apart from this use the default settings
- Approve the installation when asked

{{% notice info %}}
Red Hat recommends installing the Red Hat Advanced Cluster Security for Kubernetes Operator in the **rhacs-operator** namespace. This will happen by default..
{{% /notice %}}

### Installing the main component **Central**

{{% notice info %}}
You must install the ACS Central instance in its own project and not in the **rhacs-operator** and **openshift-operator** projects, or in any project in which you have installed the ACS Operator!
{{% /notice %}}

- Navigate to **Operators → Installed Operators**
- Select the ACS operator
- You should now be in the **rhacs-operator** project the Operator created, create a new OpenShift **Project** for the **Central** instance:
  - Create a new project called **stackrox** (Red Hat recommends using **stackrox** as the project name.) by selecting **Projects: Create project**
- In the Operator view under **Provided APIs** on the tile **Central** click **Create Instance**
- Switch to the YAML View.
- Replace the YAML content with the following:

```yaml
apiVersion: platform.stackrox.io/v1alpha1
kind: Central
metadata:
  name: stackrox-central-services
  namespace: stackrox
spec:
  monitoring:
    openshift:
      enabled: true
  central:
    notifierSecretsEncryption:
      enabled: false
    exposure:
      loadBalancer:
        enabled: false
        port: 443
      nodePort:
        enabled: false
      route:
        enabled: true
    telemetry:
      enabled: true
    db:
      isEnabled: Default
      persistence:
        persistentVolumeClaim:
          claimName: central-db
      resources:
        limits:
          cpu: 2
          memory: 6Gi
        requests:
          cpu: 500m
          memory: 1Gi
    persistence:
      persistentVolumeClaim:
        claimName: stackrox-db
  egress:
    connectivityPolicy: Online
  scannerV4:
    db:
      persistence:
        persistentVolumeClaim:
          claimName: scanner-v4-db
    indexer:
      scaling:
        autoScaling: Disabled
        maxReplicas: 2
        minReplicas: 1
        replicas: 1
    matcher:
      scaling:
        autoScaling: Disabled
        maxReplicas: 2
        minReplicas: 1
        replicas: 1
    scannerComponent: Default
  scanner:
    analyzer:
      scaling:
        autoScaling: Disabled
        maxReplicas: 2
        minReplicas: 1
        replicas: 1
```

- Click **Create**

After the deployment has finished (**Status** `Conditions: Deployed, Initialized` in the Operator view on the **Central** tab), it can take some time until the application is completely up and running. One easy way to check the state, is to switch to the **Developer** console view on the upper left. Then make sure you are in the **stackrox** project and open the **Topology** map. You'll see the three deployments of the **Central** instance:

- **scanner**
- **scanner-db**
- **central**
- **central-db**

Wait until all Pods have been scaled up properly.

**Verify the Installation**

Switch to the **Administrator** console view again. Now to check the installation of your **Central** instance, access the **ACS Portal**:

- Look up the **central-htpasswd** secret that was created to get the password

{{% notice info %}}
If you access the details of your **Central** instance in the Operator page you'll find the complete commandline using `oc` to retrieve the password from the secret under `Admin Credentials Info`. Just sayin... ;)
{{% /notice %}}

- Look up and access the route **central** which was also generated automatically.

This will get you to the **ACS Portal**, accept the self-signed certificate and login as user **admin** with the password from the secret.

Now you have a **Central** instance that provides the following services in an
RHACS setup:

- The application management interface and services. It handles data persistence, API interactions, and user interface access. You can use the same **Central** instance to **secure multiple** OpenShift or Kubernetes clusters.

- Scanner, which is a vulnerability scanner for scanning container images. It analyzes all image layers for known vulnerabilities from the Common Vulnerabilities and Exposures (CVEs) list. Scanner also identifies vulnerabilities in packages installed by package managers and in dependencies for multiple programming languages.

To actually do and see anything you need to add a **SecuredCluster** (be it the same or another OpenShift cluster). For effect go to the **ACS Portal**, the Dashboard should by pretty empty, click on either of the **Compliance** link in the menu to the left, lots of zero's and empty panels, too.

This is because you don't have a monitored and secured OpenShift cluster yet.

### Prepare to add Secured Clusters

Now we'll add your OpenShift cluster as **Secured Cluster** to ACS.

First, you have to generate an init bundle which contains certificates and is used to authenticate a **SecuredCluster** to the **Central** instance, regardless if it's the same cluster as the Central instance or a remote/other cluster.

We are using the API to create the init bundle in this workshop, because if we use the Web Terminal we can't upload and downloaded file to it. For the steps to create the init bundle in the ACS Portal see the appendix.

Let's create the init bundle using the ACS **API** on the commandline:

Go to your Web Terminal (if it timed out just start it again), then paste, edit and execute the following lines:

- Set the ACS API endpoint, replace `<central_url>` with the base URL of your ACS portal (without 'https://' e.g. central-stackrox.apps.cluster-cqtsh.cqtsh.example.com)

```bash
export ROX_ENDPOINT=<central_url>:443
```

- Set the admin password (same as for the portal, look up the secrets again)

```bash
export PASSWORD=<password>
```

- Give the init bundle a name

```bash
export DATA={\"name\":\"my-init-bundle\"}
```

- Finally run the `curl` command against the API to create the init bundle using the variables set above

```bash
curl -k -o bundle.json -X POST -u "admin:$PASSWORD" -H "Content-Type: application/json" --data $DATA https://${ROX_ENDPOINT}/v1/cluster-init/init-bundles
```

- Convert it to the needed format

```bash
cat bundle.json | jq -r '.kubectlBundle' > bundle64
```

```bash
base64 -d bundle64 > kube-secrets.bundle
```

You should now have these two files in your Web Terminal session: `bundle.json` and `kube-secrets.bundle`.

The init bundle needs to be applied to all OpenShift clusters you want to secure and monitor.

{{% notice info %}}
As said, you can create an init bundle in the ACS Portal, download it and apply it from any terminal where you can run `oc` against your cluster. We did it the API way to show you how to do it and to enable you to use the Web Terminal.
{{% /notice %}}

### Prepare the Secured Cluster

For this workshop we run **Central** and **SecuredCluster** on one OpenShift cluster. E.g. we monitor and secure the same cluster the central services live on.

**Apply the init bundle**

Again in the web terminal:

- Run `oc create -f kube-secrets.bundle -n stackrox` pointing to the init bundle you downloaded from the Central instance or created via the API as above.
- This will create a number of secrets, the output should be:

```
secret/collector-tls created
secret/sensor-tls created
secret/admission-control-tls created
```

### Add the Cluster as **SecuredCluster** to **ACS Central**

You are ready to install the **SecuredClusters** instance, this will deploy the secured cluster services:

- In the **OpenShift Web Console** go to the **ACS Operator** in **Operators->Installed Operators**
- Using the Operator create an instance of the **Secured Cluster** type **in the Project you created** (should be stackrox)
- If you are in the **YAML** view switch to the **Form** view
- Change the **Cluster Name** for the cluster if you want, it'll appear under this name in the **ACS Portal**
- And most importantly for **Central Endpoint** enter the address and port number of your **Central** instance, this is the same as the **ACS Portal**.
  - If your **ACS Portal** is available at `https://central-stackrox.apps.<DOMAIN>` the endpoint is `central-stackrox.apps.<DOMAIN>:443`.
- Under **Admission Control Settings** make sure
  - **listenOnCreates**, **listenOnUpdates** and **ListenOnEvents** is enabled
  - Set **Contact Image Scanners** to **ScanIfMissing**
  <!-- - Under **Per Node Settings** -> **Collector Settings** change the value for **Collection** form `EBPF` to `KernelModule`. This is a workaround for a known issue. -->
- Click **Create**

Now go to your **ACS Portal** again, after a couple of minutes you should see your secured cluster under **Platform Configuration->Clusters**. Wait until all **Cluster Status** indicators become green.

## Configure Quay Integrations in ACS

### Create an integration to scan the Quay registry

To enable scanning of images in your Quay registry, you'll have to configure an **Integration** with valid credentials, so this is what you'll do.

Now create a new Integration:

- Access the **RHACS Portal** and configure the already existing integrations of type **Generic Docker Registry**.
- Go to **Platform Configuration -> Integrations -> Generic Docker Registry**.
- Click the **New integration** button
- **Integration name**: Quay local
- **Endpoint**: `https://quay-quay-quay.apps.<DOMAIN>` (replace domain if required)
- **Username**: quayadmin
- **Password**: quayadmin
- Press the **Test** button to validate the connection and press **Save** when the test is successful.

## Architecture recap

{{< figure src="../images/workshop_architecture_stackrox.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
