+++
title = "The DevSecOps Workshop"
weight = 1
+++

## Intro
This workshop is meant to introduce you to the application development cycle leveraging [OpenShift's](https://www.redhat.com/en/technologies/cloud-computing/openshift) tooling & features with a special focus on securing your environment using [Advanced Cluster Security for Kubernetes (ACS)](https://www.redhat.com/en/technologies/cloud-computing/openshift/advanced-cluster-security-kubernetes). And all in a fun way.

This is the storyline you'll follow today:

- Create application using the browser based development environment [CodeReady Workspaces](https://developers.redhat.com/products/codeready-workspaces/overview)
- Setting up the **Inner Dev Loop**
  - Use the cli tool [odo](https://developers.redhat.com/products/odo/overview) to create, push, change apps on the fly
- Setting up the **Outer Dev Loop**
  - Learn to work with OpenShift Pipelines based on Tekton
  - Use OpenShift GitOps based on ArgoCD
- Secure your app and OpenShift cluster with **ACS**
  - Introduction to ACS
  - Example use cases
  - Add ACS scanning to Tekton Pipeline

## What to Expect
We try to balance guided workshop steps and challenging you to use your knowledge to learn new skills. This means you'll get detailed step-by-step instructions for every new chapter/task, later on the guide will become less verbose and we'll weave in some challenges.

{{% notice warning %}}
This workshop is for intermediate OpenShift users. A good understanding of how OpenShift works along with hands-on experience is expected. For example we will not tell you how to log in with `oc` to your cluster or tell you what it is... ;)
{{% /notice %}}

## Workshop Environment
As part of the workshop you will be provided with freshly installed OpenShift 4.9 clusters. Depending on attendee numbers we might ask you to gather in teams. Some workshop tasks must be done only once for the cluster (e.g. installing Operators), others like deploying and securing the application can be done by every team member separately in their own Project. This will be mentioned in the guide.

As there is not special setup for the OpenShift cluster you should be able to run the workshop with any 4.9 cluster of you own. 

## Workshop Flow
We'll tackle the topics at hand step by step with an introduction covering the things worked on before every section.
