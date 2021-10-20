+++
title = "Outer Loop"
weight = 8
+++

Now that you have seen how a developer can quickly start to code using modern tooling, it's time to learn how to proceed with the application to production. The first step is to implement a build pipeline to automate new builds. Let's call this stage `int`.

To create and run the build pipeline you'll use OpenShift Pipelines/Tekton. The first step is to install it:

- Install `OpenShift Pipelines` from OperatorHub

After this create a new deployment of your game-changing application:

- Switch to the **OpenShift Developer Console**
- Create a new project `deepspace-int`
- Click the **+Add** menu entry to the right and choose **From Git**
- As **Git Repo URL** enter your Gitea clone URL
- As **Builder Image** keep or select **Red Hat OpenJDK 11 (RHEL 7)**
- Remove `-git` from all names
- Check **Add pipeline**
- Click **Create**
- Observe how the Tekton Pipeline is created

Now your build pipeline has been set up and is ready to run. There is one more step in preparation of the security part of this workshop. We need a way to build and deploy from an older image with some security issues in it.

- In the default `Java` image stream create another **Image Stream Tag** that points to an older version.
- Using the Administrator view, switch to the project `openshift` and under **Builds** access the **ImageStreams** Tag : java-old-image
- Search and open the **ImageStream** `Java`
- Switch to YAML view and add the following snippet to the `tags:` section.
  - Be careful to keep the needed indents!

```
- name: java-old-image
     annotations:
       description: Build and run Java applications using Maven and OpenJDK 8.
       iconClass: icon-rh-openjdk
       openshift.io/display-name: Red Hat OpenJDK 8 (UBI 8)
       sampleContextDir: undertow-servlet
       sampleRepo: 'https://github.com/jboss-openshift/openshift-quickstarts'
       supports: 'java:8,java'
       tags: 'builder,java,openjdk'
       version: '8'
     from:
       kind: DockerImage
       name: 'registry.redhat.io/openjdk/openjdk-11-rhel7:1.1-9'
     generation: 4
     importPolicy: {}
     referencePolicy:
       type: Local
```

This will add a tag java-old-image that points to an older version. The image can be inspected here:
https://catalog.redhat.com/software/containers/openjdk/openjdk-11-rhel7/5bf57185dd19c775cddc4ce5?tag=1.10-1.1630314161&push_date=1630540002000&container-tabs=security
- Have a look at version 1.1-9

Now run the pipeline again but choose Image java-old-image this time.
