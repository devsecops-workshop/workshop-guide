+++
title = "Outer Loop"
weight = 8
+++

- Install OpenShift Pipelines from OperatorHub
- Go to OpenShift Developer Console
- Create Project deepspace-int
- Add “From Git”
- Enter Git URL
- Java 11 Builder
- Create Deployment
- Create Tekton Pipeline
- Remove git from names
- Cancel Pipeline Build
- Create Old Image Stream Tag
- NS : openshift, Tag : java-old-image

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


- Have look at https://catalog.redhat.com/software/containers/openjdk/openjdk-11-rhel7/5bf57185dd19c775cddc4ce5?tag=1.10-1.1630314161&push_date=1630540002000&container-tabs=security
- Have a look at version 1.1-9
- Build the pipeline again but choose Image java-old-image
