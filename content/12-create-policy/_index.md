+++
title = "Create a Custom Security Policy"
weight = 25
+++

## Objective
You should by now have one or more pipelines to build your application, now we want to secure the build and deployment of it. For the sake of this workshop we'll take a somewhat simplified use case:

**We want to scan our application image for the Red Hat Security Advisory RHSA-2020:5566 concerning openssl-lib.**

 If this RHSA is found in an image we don't want to deploy the application using it.

These are the steps you will go through:

- Create a custom **Security Policy** to check for the advisory
- Test if the policy is triggered in non-enforcing mode
  - with an older image version that contains the advisory
  - and then with a newer versiowhere the issue has been fixed.
- The final goal is to integrate the policy into the build pipeline

## Create a Custom System Policy

First create the system policy. In the **ACS Portal** do the following:

- **System Policies->Create Policy**
- **NAME:** Workshop RHSA-2020:5566
- **Severity:** Critical
- **Lifecycle Stages:** Build, Deploy
- **Categories:** Workshop
  - This will create a new Category if it doesn't exist
- **->Next**
- Click **Add a new condition**
- Find the policy field **CVE** in **Image Contents** and drag-and-drop it into the **Drop A Policy Field Inside** area.
- Put `RHSA-2020:5566` into the **CVE** field
- Click **->Next**
- The next page will show **Deployments** that would generate violations
- Click **->Next**
- On the next page you could enable enforcement of the policy for the **Build** and/or **Deploy** stages. **Don't enable enforcement yet!**
- Click **Save**

## Test the Policy

Start the pipeline with the affected image version:
- Go to the Pipeline, Start it and set **Version** to `java-old-image`
- Follow the **Violations** in the **ACS Portal**
- Expected result:
  - You'll see the build deployments (`Quarkus-Build-Options-Git-Gsklhg-Build-...`) come and go when they are finished.
  - When the final build is deployed you'll see a violation in **ACS Portal** for policy `Workshop RHSA-2020:5566` (Check the Time of the violation)

Now start the pipeline with the fixed image version that doesn't contain the CVE anymore:
- Start the pipeline again but this time leave the Java **Version** as is.
- Follow the **Violations** in the **ACS Portal**
- Expected result:
  - You'll see the build deployments come up and go
  - When the final build is deployed you'll see the policy violation in **ACS Portal** from before is gone because the image no longer contains it.

This shows how ACS is automatically scanning images when they become active against all enabled policies. But we don't want to just see a violation after the image has been deployed, we want to disable the deployment during build time! So the next step is to integrate the check into the build pipeline and enforce it (don't deploy the application).
