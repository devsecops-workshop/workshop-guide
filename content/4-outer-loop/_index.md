+++
title = "Outer Loop"
weight = 8
+++

Now that you have seen how a developer can quickly start to code using modern cloud native tooling, it's time to learn how to push the application towards a production environment. The first step is to implement a CI/CD pipeline to automate new builds. Let's call this stage `int` for integration.

## Install OpenShift Pipelines

To create and run the build pipeline you'll use OpenShift Pipelines based on project Tekton. The first step is to install it:

- Install the `Red Hat OpenShift Pipelines` Operator
  - In the **OpenShift Web Console** select **Operators > OperatorHub**
  - Find the `Red Hat OpenShift Pipelines` Operator and install it with the default settings

{{% notice warning %}}
Since the Piplines assets are installed asynchronously it is possible that the `Pipeline Templates` are not yet setup when proceeding immedately to the next step. So now is good time to grab a coffee.
{{% /notice %}}

## Create App Deployment and Build Pipeline

After installing the Operator create a new deployment of your game-changing application:

- Create a new OpenShift project called `workshop-int` (e.g. using the **Projects** menu item at the top)
- In the left menu at the top switch to the **OpenShift Developer Console** by clicking on **Administrator > Developer**
- Close the welcome pop up
- Make sure you are still in the `workshop-int` project by verifying in the top **Project** menu
- Click the **+Add** menu entry to the left and choose the **Import from Git** card
- As **Git Repo URL** enter the clone URL for the `quarkus-build-options` repo in your `Gitea` instance
  - There might be a warning about the repo url that you can ignore
  - Leave **Git type** set to `other`
- Click **Show advanced Git options** and for **Git reference** enter `master`
- As **Import Strategy** select `Builder Image`
- As **Builder Image** select `Java` and `openjdk-11-el7 / Red Hat OpenJDK 11 (RHEL 7)`
  - We are choosing this image as we have prepared some CVEs in a later chapter based on this image
- As **Application Name** enter `workshop-app`
- As **Name** enter `workshop`
- Check **Add pipeline**

{{% notice warning %}}
If you don't have the checkbox **Add pipeline** and get the message `There are no pipeline templates available for Java and Deployment combination` in the next step then just give it few more minutes and reload the page.
{{% /notice %}}

- Click **Create**
- In the main menu left, click on **Pipelines** and then the instance in column **Last run** and observe how the Pipeline is executed
  {{< figure src="../images/pipeline_initial.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

## Adjust the Pipeline to Deploy to Quay

The current Pipeline deploys to the Internal Registry by default. The image that was just created by the first run was pushed there.

To leverage our brand new **Quay** registry we need to modify the Pipeline in order to push the images to the **Quay** registry. In addition the \*_OpenShift ImageStream_ must be modified to point to the Quay registry, too.

### Create a new `s2i-java` ClusterTask

The first thing is to create a new **Source-To-Image Pipeline Task** to automatically update the **ImageStream** to point to **Quay**. You could of course copy and modify the default `s2i-java` task using the built-in YAML editor of the **OpenShift Web Console**. But to make this as painless as possible we have prepared the needed YAML object definition for you already.

- Open a Web Terminal by clicking the **>\_** in the upper right of the web console, from here you can run `oc` commands
- The YAML object definitions for this lab are in the repo `https://github.com/devsecops-workshop/yaml.git`, go there and review the YAML definition.
- Apply the YAML for the new ClusterTask:

```bash
oc create -f https://raw.githubusercontent.com/devsecops-workshop/yaml/main/s2i-java-workshop.yml
```

{{< figure src="../images/web-terminal2.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

There is an issue with the delivered version of the **Skopeo Pipeline Task**, so we will also import an updated version. This may not be necessary in the future

- Apply the YAML to import it:

```bash
oc create -f https://raw.githubusercontent.com/devsecops-workshop/yaml/main/skopeo-update.yml
```

{{% notice tip %}}
To make this lab pretty much self-contained, we run `oc` commands from the OCP Web Terminal. But of course you can do the above steps from any Linux system where you set up the `oc` command.
{{% /notice %}}

You should now have a new **ClusterTask** named `s2i-java-workshop`, go to the **OpenShift Web Console** and check:

- Switch to the **Administrator** view
- Switch to the `workshop-int` Project
- Go to **Pipelines**->**Tasks**->**ClusterTasks**
- Search for the `s2i-java-workshop` **ClusterTask** and open it
- Switch to the YAML view

Please take the time to review the additions to the default `s2i-java` task:

In the `params` section there are two new parameters, that will tell the pipeline which **ImageStream** and tag to update.

```yaml
- default: ''
    description: The name of the ImageStream which should be updated
    name: IMAGESTREAM
    type: string
- default: ''
    description: The Tag of the ImageStream which should be updated
    name: IMAGESTREAMTAG
    type: string
```

At the end of the `steps` section is a new step that takes care of actaully creating the **ImageStream** tag that points to the image in **Quay**

```yaml
- env:
    - name: HOME
      value: /tekton/home
    image: 'image-registry.openshift-image-registry.svc:5000/openshift/cli:latest'
    name: update-image-stream
    resources: {}
    script: >
      #!/usr/bin/env bash

      oc tag --source=docker $(params.IMAGE)
      $(params.IMAGESTREAM):$(params.IMAGESTREAMTAG) --insecure
    securityContext:
      runAsNonRoot: true
      runAsUser: 65532
```

### Modify the Pipeline

Now that we have our new build tasks we need to modify the pipeline to:

- Introduce the new parameters into the **Pipeline** configuration
- Use the new `s2i-java-workshop` task

To make this easier we again provide you with a full YAML definition for the Pipeline.

Do the following:

- Go to your Web Terminal (if it timed out just start it again)

{{% notice tip %}}
If you use this lab guide with your domain as query parameter (see [here](https://devsecops-workshop.github.io/1-intro/#and-finally-a-sprinkle-of-javascript-magic)), you are good to go with the command below because your domain was already inserted into the command.
If not, you have to replace \<DOMAIN> manually.
{{% /notice %}}

- First get the YAML file:

```bash
curl https://raw.githubusercontent.com/devsecops-workshop/yaml/main/workshop-pipeline-without-git-update.yml -o workshop-pipeline-without-git-update.yml
```

- Now we have to replace the `REPLACEME` placeholders in the YAML file with your lab domain.
- Run (Insert your domain if not done automatically):

```bash
sed -i 's/REPLACEME/<DOMAIN>/g' workshop-pipeline-without-git-update.yml
```

- Apply the new definition:

```bash
oc replace -f workshop-pipeline-without-git-update.yml
```

Again take the time to review the changes in the web console:

- In the **OpenShift Web Console** menu go to **Pipelines->Pipelines**
- Click the `workshop` Pipeline and switch to YAML
- These are the new parameters that have been added to the pipeline:

```yaml
- default: workshop
  name: IMAGESTREAM
  type: string
- default: latest
  name: IMAGESTREAMTAG
  type: string
```

The preexisting parameter **IMAGE_NAME** now points to your local **Quay** registry:

```yaml
   - default: >-
        quay-quay-quay.apps.<DOMAIN>/openshift_workshop-int/workshop
      name: IMAGE_NAME
      type: string
```

And finally the `build` task was modified to work with the two new parameters:

```yaml
tasks:
    - name: build
      params:
        [...]
        - name: IMAGESTREAM
          value: $(params.IMAGESTREAM)
        - name: IMAGESTREAMTAG
          value: $(params.IMAGESTREAMTAG)
```

- The name of the `taskRef` was changed to `s2i-java-workshop`, in order to use our custom **Pipeline Task**:

```yaml
taskRef:
  kind: ClusterTask
  name: s2i-java-workshop
```

You are done with adapting the Pipeline to use the **Quay** registry!

We are ready to give it a try, but first let's have quick look at our target **Quay** repository

- Go to the **Quay** portal and there to the `openshift_workshop-int` organization.
- In the `openshift_workshop-int / workshop` repository access the **Tags** in the menu to the left.
- There should be no container image (yet)
  {{< figure src="../images/quay_empty_repo.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

Now it's time to configure and start the Pipeline.

- In **OpenShift Web Console** open the **Pipelines** view
- Open the `workshop` Pipeline
- Go to the top right menu and choose **Actions -> Start**

In the **Start Pipeline** window that opens, but **before (!)** starting the actual pipeline, we need to add a **Secret** so the pipeline can authenticate and push to the **Quay** repository:

- Switch to the **Quay Web Portal** and click on the `openshift_workshop-int / workshop` repository
- On the left click on **Settings**
- Click on the `openshift_workshop-int+builder` **Robot Account** and copy the username and token
  {{< figure src="../images/quay_robot_account.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
- Back in the **Start Pipeline** form
  - At the buttom, click on **Show credential options** and then **Add secret**
  - Set these values
    - **Secret name** : `quay-workshop-int-token`
    - **Access to** : `Image Registry`
    - **Authentication type** : `Basic Authentication`
    - **Server URL** : `quay-quay-quay.apps.<DOMAIN>/openshift_workshop-int` (replace your cluster domain if necessary)
    - **Username** : `openshift_workshop-int+builder`
    - **Password or token** : the token you copied from the **Quay Robot Account** before ...
  - Then click on the checkmark below to add the secret
  - The secret has just been added and will be mounted automatically everytime the pipeline runs
- Hit **Start**

Once the Pipeline run has finished, go to the **Quay Portal** and check the **Repository** `openshift_workshop-int/workshop` again. Under **Tags** you should now see a new `workshop` Image version that was just pushed by the pipeline.

Congratulations: **Quay** is now a first level citizen of your pipeline build strategy.

## Create an ImageStream Tag with an Old Image Version

Now that your build pipeline has been set up and is ready. There is one more step in preparation of the security part of this workshop. We need a way to build and deploy from an older image with some security issues in it. For this we will add another **ImageStream** Tag in the default `Java` ImageStream that points to an older version with a known CVE issue in it.

- Using the **OpenShift Administrator view**, switch to the project `openshift` and under **Builds** click on **ImageStreams**
- Search and open the **ImageStream** `java`
- Switch to YAML view and add the following snippet to the `spec > tags:` section.
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

This will add a tag `java-old-image` that points to an older version of the RHEL Java image. The image and security vulnerabilities can be inspected in the **Red Hat Software Catalog** [here](https://catalog.redhat.com/software/containers/openjdk/openjdk-11-rhel7/5bf57185dd19c775cddc4ce5?tag=1.10-1&push_date=1629294893000&container-tabs=security)

- Have a look at version `1.10-1`

We will use this tag to test our security setup in a later chapter.

## Create a new Project

For the subsequent exercises we need a new project:

- Create a new OpenShift Project `workshop-prod`

## Architecture recap

{{< figure src="../images/workshop_architecture_outer_loop.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
