+++
title = "The DevSecOps Workshop"
weight = 1
+++

## Intro

This is the storyline you'll follow:

- Create application using the browser based development environment [CodeReady Workspaces](https://developers.redhat.com/products/codeready-workspaces/overview)
- Setting up the **Inner Development Loop** for the individual developer
  - Use the cli tool [odo](https://developers.redhat.com/products/odo/overview) to create, push, change apps on the fly
- Setting up the **Outer Development Loop** for the team CI/CD
  - Learn to work with OpenShift Pipelines based on Tekton
  - Use OpenShift GitOps based on ArgoCD
- Secure your app and OpenShift cluster with **ACS**
  - Introduction to ACS
  - Example use cases
  - Add ACS scanning to Tekton Pipeline

## What to Expect

{{% notice tip %}}
This workshop is for intermediate OpenShift users. A good understanding of how OpenShift works along with hands-on experience is expected. For example we will not tell you how to log in with `oc` to your cluster or tell you what it is... ;)
{{% /notice %}}

We try to balance guided workshop steps and challenging you to use your knowledge to learn new skills. This means you'll get detailed step-by-step instructions for every new chapter/task, later on the guide will become less verbose and we'll weave in some challenges.
## Workshop Environment
### As Part of a Red Hat Workshop
As part of the workshop you will be provided with freshly installed OpenShift 4.9 clusters. Depending on attendee numbers we might ask you to gather in teams. Some workshop tasks must be done only once for the cluster (e.g. installing Operators), others like deploying and securing the application can be done by every team member separately in their own Project. This will be mentioned in the guide.

### On Your Own
As there is not special setup for the OpenShift cluster you should be able to run the workshop with any 4.9 cluster of you own. Just make sure you have cluster admin privileges.

This workshop was tested with these versions :
- OpenShift : 4.10
- Advanced Cluster Security for Kubernetes: 3.71.0
- Red Hat OpenShift Dev Spaces : 3.1.0
- Red Hat OpenShift Pipelines: 1.8.0
- Red Hat OpenShift GitOps: 1.6.0
- Red Hat Quay: 3.7.7
- Red Hat Quay Bridge Operator: 3.7.7
## Workshop Flow
We'll tackle the topics at hand step by step with an introduction covering the things worked on before every section.
