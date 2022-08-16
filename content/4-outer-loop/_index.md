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

## Create an ImageStream Tag with an Old Image Version

Now your build pipeline has been set up and is ready. There is one more step in preparation of the security part of this workshop. We need a way to build and deploy from an older image with some security issues in it. For this we will add another ImageStream `Tag` in the default `Java` ImageStream that points to an older version with a known issue in it.

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
