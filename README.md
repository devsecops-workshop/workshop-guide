# DevSecOps Workshop Guide

This is the source for the guide for the DevSecOps workshop. The workshop is meant to provide
a hands-on introduction to modern adn secure application development and deployment workflows using OpenShift and technologies such as odo (OpenShift do), CodeReadyWorkspaces, Openshift Pipelines (Tekton), OpenShift GitOps (ArgoCD) and security though Advanced Cluster Security (Stackrox). Our goal was explicitly to not have another demo but to provide a fun learning experience starting out with a blank OpenShift cluster. You will learn to build up this kind of professional environment by yourself.

The markdown source lives in /content, this repo is rendered with a Hugo static site generator automatically

## Access the Rendered Guide

Production (latest-release branch) : https://devsecops-workshop.github.io/

Staging (master branch) : https://devsecops-workshop.github.io/devsecops-workshop.github.io-dev/

### Live Customizing of the Guide

You can add query parameters to customize the for each partcipant content

**hostname** : Enter the hostname of the OpenShift instance (just the part after \*apps.) and all occurences of placeholder <HOSTNAME> will be replaced in the guide

**hidechapters** : Pass a : separated list of chapternumbers to be hidden (starting from 0)

#### Example :

http://devsecops-workshop.github.io/4-outer-loop/?domain=cluster-7812.53m24.sandbox9346.opentlc.com&hidechapters=0:2:3:7
