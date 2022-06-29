+++
title = "Create a Custom Security Policy"
weight = 25
+++

## Objective

You should have one or more pipelines to build your application from the first workshop part, now we want to secure the build and deployment of it. For the sake of this workshop we'll take a somewhat simplified use case:

**We want to scan our application image for the Red Hat Security Advisory RHSA-2021:4904 concerning openssl-lib.**

If this RHSA is found in an image we don't want to deploy the application using it.

These are the steps you will go through:

- Create a custom **Security Policy** to check for the advisory
- Test if the policy is triggered in non-enforcing mode
  - with an older image version that contains the issue
  - and then with a newer version with the issue fixed.
- The final goal is to integrate the policy into the build pipeline

## Create a Custom System Policy

First create the system policy. In the **ACS Portal** do the following:

- **Platform Configuration->Policies->Create policy**
- **Policy Details**
  - **Name:** Workshop RHSA-2021:4904
  - **Severity:** Critical
  - **Categories:** Workshop
    - This will create a new Category if it doesn't exist
  - Click **Next**
- **Policy Behaviour**
  - **Lifecycle Stages:** Build, Deploy
  - **Response method**: Inform
  - Click **Next**
- **Policy Criteria**
  - Find the **CVE** policy criterium under **Drag out policy fields** in **Image contents**
  - Drag & drop it on the drop zone of Policy Section 1
  - Put `RHSA-2021:4904` into the **CVE identifier** field
  - Click **Next**
- **Policy Scope**
  - You could limit the scope the policy is applied in, do nothing for now.
- **Review Policy**
  - Have a quick look around, if the policy would create a violation you get a preview here.
  - Click **Save**

{{< figure src="../images/custom-policy.png?width=25pc&classes=border,shadow" title="Click image to enlarge" >}}

## Test the Policy

Start the pipeline with the affected image version:

- In the **OpenShift Web Console** go to the Pipeline in your `workshop-int` project, start it and set **Version** to `java-old-image` (Remember how we set up this `ImageStream` `tag` to point to an old and vulnerable version of the image?)
- Follow the **Violations** in the **ACS Portal**
- Expected result:
  - You'll see the build deployments (`Quarkus-Build-Options-Git-Gsklhg-Build-...`) come and go when they are finished.
  - When the final build is deployed you'll see a violation in **ACS Portal** for policy `Workshop RHSA-2021:4904` (Check the Time of the violation)

{{% notice tip %}}
There will be other policy violations listed, triggered by default policies, have a look around. Note that none of the policies is enforced (as in stop the pipeline build) yet!
{{% /notice %}}

Now start the pipeline with the fixed image version that doesn't contain the CVE anymore:

- Start the pipeline again but this time leave the Java **Version** as is (`openjdk-11-el7`).
- Follow the **Violations** in the **ACS Portal**
- Expected result:
  - You'll see the build deployments come up and go
  - When the final build is deployed you'll see the policy violation for `Workshop RHSA-2021:4904` for your deployment is gone because the image no longer contains it.

This shows how ACS is automatically scanning images when they become active against all enabled policies. But we don't want to just **admire a violation** after the image has been deployed, we want to disable the deployment during build time! So the next step is to integrate the check into the build pipeline and enforce it (don't deploy the application).
