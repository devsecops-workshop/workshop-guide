+++
title = "Prepare Cluster"
weight = 6
+++

## Prepare Cluster

## Integrate Quay as Registry into OpenShift

To synchronize the internal default OpenShift Registry with the Quay Registry, **Quay Bridge** is used. Now we need to create a new Organization in **Quay**:

- To access the **Quay** Portal make sure you are in the `quay` Project
- Go to **Networking->Routes**, access the Quay portal using the URL of the first route (`quay-quay`)
- Login with
  - **User**: quayadmin
  - **Password**: quayadmin
- In the top _+_ menu click **Create New Organization**
  - Name it `openshift_integration`
- Click **Create Organization**

We need an OAuth Application in Quay for the integration:

- Again In the **Quay** Portal, click the **Applications** icon in the menubar to the left
- Click **Create New Application** at the upper right
  - Name it `openshift`, press Enter and click on the new `openshift` item by clicking it
- In the menubar to the left click the **Generate Token** icon
  - Check all boxes and click **Generate Access token**
    {{< figure src="../images/quay-access-token.png?width=45pc&classes=border,shadow" title="Click image to enlarge" >}}
  - In the next view click **Authorize Application** and confirm
  - In the next view copy the **Access Token** and save it somewhere, we'll need it again

Now create a new secret for Quay Bridge to access Quay. In the OpenShift web console make sure you are in the `quay` Project. Then:

  - Go to **Workloads->Secrets** and click **Create->Key/value secret**
    - **Secret name**: quay-credentials
    - **Key**: token
    - **Value**: paste the Access Token you generated in the Quay Portal in the text field below the grey _Value_ field
    - Click **Create**

And you are done with the installation and integration of Quay as your registry! Test if the integration works:

- In the Quay Portal you should see your Openshift Projects are synced and represented as Quay Organizations, prefixed with `openshift_` (you might have to reload the browser).
  - E.g. there should be a `openshift_git` Quay Organization.
- In the OpenShift web console create a new test Project, make sure it's synced to Quay as an Organization and delete it again.

## Architecture recap

{{< figure src="../images/workshop_architecture_prepare.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
