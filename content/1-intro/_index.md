+++
title = "The DevSecOps Workshop"
weight = 1
+++

## Intro
This workshop is meant to introduce you to the application development cycle leveraging OpenShift's tooling & features with a special focus on securing your environment using Advanced Cluster Security for Kubernetes (ACS). And all in a **fun way**.

This is the storyline you'll follow today:

- Create application using CodeReady Workspaces
- Inner Dev Loop
  - Use [odo](https://developers.redhat.com/products/odo/overview) to create, push, change apps on the fly
- Outer Dev Loop
  - Learn to work with Tekton Pipelines
  - Use GitOps with ArgoCD
- Secure your app and OpenShift cluster with **ACS**
  - Introduction to ACS
  - Example use cases
  - Add ACS scanning to Tekton Pipeline

## What to Expect
We try to balance guided workshop steps and challenging you to use your knowledge to learn new skills. This means you'll get detailed step-by-step instructions for every new chapter/task, later on the guide will become less verbose and we'll weave in some challenges.

{{% notice warning %}}
A good understanding of how OpenShift works together with hands-on experience is expected. For example we will not tell you how to log in `oc` to your cluster or tell you what it is... ;)
{{% /notice %}}

## Workshop Environment
You will be provided with freshly installed OpenShift 4 clusters running in AWS. Depending on attendee numbers we might ask you to gather in teams. Some workshop tasks must be done only once for the cluster (e.g. installing Operators), others like deploying and securing the application can be done by every team member separately in her/his own Project. This will be mentioned in the guide.

## Workshop Flow
We'll tackle the topics at hand step by step with an introduction covering the things worked on before every section.
