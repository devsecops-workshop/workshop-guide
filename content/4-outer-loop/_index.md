+++
title = "Outer Loop"
weight = 8
+++

Now that you have seen how a developer can quickly start to code using modern cloud native tooling, it's time to learn how to proceed with the application towards production. The first step is to implement a CI/CD pipeline to automate new builds. Let's call this stage `int` for integration.

## Install OpenShift Pipelines

To create and run the build pipeline you'll use OpenShift Pipelines based on project Tekton. The first step is to install it:

- Install the `Red hat OpenShift Pipelines` Operator from OperatorHub with default settings
  {{% notice warning %}}
  Since the Piplines assets are installed asynchronously it is possible that the `Pipeline Templates` are not yet setup when proceeding immedately to the next step. So now is good time to grab a coffee.
  {{% /notice %}}

## Create App Deployment and Build Pipeline

After installing the Operator create a new deployment of your game-changing application:

- Create a new OpenShift project `workshop-int`
- Switch to the **OpenShift Developer Console**
- Click the **+Add** menu entry to the left and choose **Import from Git**
- As **Git Repo URL** enter the clone URL for the `quarkus-build-options` repo in your your `Gitea` instance (There might be a warning about the repo url that you can ignore)
- Click **Show advanced Git options** and for **Git reference** enter `master`
- As **Import Strategy** select `Builder Image`
- As **Builder Image** select `Java` and `openjdk-11-el7 / Red Hat OpenJDK 11 (RHEL 7)`
- As **Application Name** enter `workshop-app`
- As **Name** enter `workshop`
- Check **Add pipeline**

{{% notice warning %}}
If you don't have the checkbox **Add pipeline** and get the message `There are no pipeline templates available for Java and Deployment combination` in the next step then just give it few more minutes and reload the page.
{{% /notice %}}

- Click **Create**
- In the main menu left, click on **Pipelines** and observe how the Tekton Pipeline is created and run.

## Install Red Hat Quay Container Registry

The image that we have just deployed was pushed to the internal OpenShift Registry which is a great starting point for your cloud native journey. But if you require more control over you image repos, a graphical GUI, scalability, internal security scanning and the like you may want to upgrade to Red Hat Quay. So as a next step we want to replace the internal registry with Quay.

Quay installation is done through an operator, too:

- In **Operators->OperatorHub** filter for `Quay`
- Install the **Red Hat Quay** operator with default settings
- Create a new namespace `quay`
- In the namespace go to **Administration->LimitRanges** and delete the `quay-core-resource-limits`
  {{< figure src="../images/delete-limit-range.png?width=45pc&classes=border,shadow" title="Click image to enlarge" >}}
- In the operator overview of the Quay Operator on the **Quay Registry** tile click **Create instance**
- If the _YAML view_ is shown sitch to _Form view_
- Make sure you are in the `quay` project
- Change the name to `quay`
- Click **Create**
- Click the new registry, scroll down to **Conditions** and wait until the **Available** type changes to `True`
  {{< figure src="../images/quay-available.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

Now that the Registry is installed you have to configure a superuser:

- Make sure you are in the `quay` Project
- Go to **Networking->Routes**, access the Quay portal using the first route (`quay-quay`)
- Click **Create Account**
  - As username put in `quayadmin`, a (fake) email address and a password.
- Click **Create Account** again
- In the OpenShift web console open **Workloads->Secrets**
- Search for `quay-config-editor-credntials-...`, open the secret and copy the values, you'll need them in a second.
- Go back to the **Routes** and open the `quay-quay-config-editor` route
- Login with the values of the secret from above
- Click **Sign in**
- Scroll down to **Access Settings**
- As **Super User** but in `quayadmin`
- click **Validate Configuration Changes** and after the validation click **Reconfigure Quay**

Reconfiguring Quay takes some time. The easiest way to determine if it's been finished is to open the Quay portal (using the `quay-quay` Route). At the upper right you'll see the username (`quayadmin`), if you click the username the drop-down should show a link **Super User Admin Panel**. When it shows up you can proceed.

{{< figure src="../images/quay-superuser.png?width=15pc&classes=border,shadow" title="Click image to enlarge" >}}

## Integrate Quay as Registry into OpenShift

To replace the internal default OpenShift Registry with the Quay Registry, **Quay Bridge** is used.

- In the OperatorHub of your cluster, search for the **Quay Bridge** Operator
- Install it with default settings
- While the Operator is installing, create a new Organization in Quay:
  - Access the Quay Portal
  - In the top _+_ menu click **Create New Organization**
    - Name it `openshift_integration`
  - Click **Create Organization**

We need an Oauth Application in Quay for the integration:

- In the Quay Portal, click the **Applications** icon in the menubar to the left
- Click **Create New Application** at the upper right
  - Name it `openshift` and select it by clicking it
- In the menubar to the left click the **Generate Token** icon
  - Check all boxes and click **Generate Access token**
    {{< figure src="../images/quay-access-token.png?width=45pc&classes=border,shadow" title="Click image to enlarge" >}}
  - In the next view click **Authorize Application** and confirm
  - In the next view copy the **Access Token** and save it somewhere, we'll need it again

Now we finally create an Quay Bridge instance. In the OpenShift web console make sure you are in the `quay` Project. Then:

- Create a new Secret

  - Go to **Workloads->Secrets** and click **Create->Key/value secret**
    - **Secret name**: quay-credentials
    - **Key**: token
    - **Value**: paste the Access Token you generated in the Quay Portal before
    - Click **Create**

- Go to the Red Hat Quay Bridge Operator overview (make sure you are in the `quay`namespace)
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

## Adjust the Pipeline to Deploy to Quay

The current Pipeline deploys that was generated deploys to the internal Registry by default. To leverage our brand new Quay we need to modify the Pipeline Image deployment target.

- Go to _Pipelines_ and click on the `workshop` pipeline
- Then in the top right _Actions_ menu select _Edit Pipeline_
- Make sure you are in the visual _Pipeline Builder_
- In _Parameters_ > `IMAGE_NAME` replace the URL with the one for your Quay Instance, including the new synced org name
  - So `image-registry.openshift-image-registry.svc:5000/workshop-int/workshop` would become something like `quay-quay-quay.apps.{DOMAIN_NAME}/openshift_workshop-int/workshop` (replacing the {DOMAIN_NAME})

Next we need to replace our _ImageStream_ `workshop`, as this is currently still pointing to the Image in the internal Registry.

Make sure you are logged into OpenShift with the cli and are in the `workshop-int` project. Then execute this command to replace the current _ImageStream_ with a version that points to the Quay Image. Make sure to replace your {DOMAIN_NAME}

```
oc import-image workshop --from=quay-quay-quay.apps.{DOMAIN_NAME}/openshift_workshop-int/workshop
```

Now we can configure and start the Pipeline again in the _Pipelines_ view by going to the top right menu _Actions_ > _Start_.

- Notice that the `IMAGE_NAME` now points to quay
- Also the `GIT_REVISION` is now mandatory, so enter `master`
- We need need to add a _Secret_ with a Quay Robot Account to enable the Pipeline Service Account to authenticate against Quay.
- Switch to Quay click on the `openshift_workshop-int / workshop` repository
- On the left click on _Settings_
- Click on the `openshift_workshop-int+builder` Robot account and copy the username and token
- Back in the _Start Pipeline_ form
  - At the buttom, click on _Show credential options_ and then _Add secret_
  - Set these values
    - _Secret name_ : `quay-token`
    - _Access to_ : `Image Registry`
    - _Authentication type_ : `Image registry credentials`
    - _Server URL_ : `quay-quay-quay.apps.{DOMAIN_NAME}` (replacing the {DOMAIN_NAME})
    - _Username_ : `openshift_workshop-int+default`
    - _Secret name_ : the token you copied from the Quay robot account before ...
  - Then click on the checkmark below to add the secret
  - The secret has just been added and will be mounted automatically everytime the pipeline runs
- Hit _Start_

Once the Pipeline has run, go the Quay. Click the _Repository_ `openshift_workshop-int/workshop` and then on the _Tags_ to the left. You should see a new `workshop` Image version that was just pushed by the pipeline. This the same Image that is now running in the Pod in your `workshop-int` namespace.

Congratulaitions : Quay is now a first level citizen of your pipeline build strategy.

## Create an ImageStream Tag with an Old Image Version

Now there your build pipeline has been set up and is ready. There is one more step in preparation of the security part of this workshop. We need a way to build and deploy from an older image with some security issues in it. For this we will add another ImageStream `Tag` in the default `Java` ImageStream that points to an older version with a known issue in it.

- Using the **Administrator** view, switch to the project `openshift` and under **Builds** click on the **ImageStreams**
- Search and open the **ImageStream** `java`
- Switch to YAML view and add the following snippet to the `tags:` section.
  - Be careful to keep the needed indentation!

```yaml
- name: java-old-image
  annotations:
    description: Build and run Java applications using Maven and OpenJDK 8.
    iconClass: icon-rh-openjdk
    openshift.io/display-name: Red Hat OpenJDK 8 (UBI 8)
    sampleContextDir: undertow-servlet
    sampleRepo: "https://github.com/jboss-openshift/openshift-quickstarts"
    supports: "java:8,java"
    tags: "builder,java,openjdk"
    version: "8"
  from:
    kind: DockerImage
    name: "registry.redhat.io/openjdk/openjdk-11-rhel7:1.10-1"
  generation: 4
  importPolicy: {}
  referencePolicy:
    type: Local
```

This will add a tag `java-old-image` that points to an older version of the RHEL Java image. The image and security vulnerabilities can be inspected in the Red Hat Software Catalog here:
https://catalog.redhat.com/software/containers/openjdk/openjdk-11-rhel7/5bf57185dd19c775cddc4ce5?tag=1.10-1&push_date=1629294893000&container-tabs=security

- Have a look at version `1.10-1`

We will use this tag to test our security setup in a later chapter.
