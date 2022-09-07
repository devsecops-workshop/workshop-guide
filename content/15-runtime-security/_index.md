+++
title = "Securing Runtime Events"
weight = 35
+++

So far you've seen how ACS can handle security issues concerning **Build** and **Deploy** stages. But ACS is also able to detect and secure container runtime behaviour. Let's have a look...

## Handling Security Issues at Runtime
As a scenario let's assume you want to protect container workloads against attackers who are trying to install software. ACS comes with pre-configured policies for Ubuntu and Red Hat-based containers to detect if a package management tool is installed, this can be used in the **Build** and **Deploy** stages:

- **Red Hat Package Manager in Image**

And, more important for this section about runtime security, a policy to detect the execution of a package manager as a runtime violation, using Kernel instrumentation:

- **Red Hat Package Manager Execution**

In the **ACS Portal**, go to **Platform Configuration->Policies**, search for the policies by e.g. typing `policy` and then `red hat` into the filter. Open the policy detail view by clicking it and have a look at what they do.

{{% notice tip %}}
You can use the included policies as they are but you can always e.g. clone and adapt them to your needs or write completely new ones.
{{% /notice %}}

As you can see the **Red Hat Package Manager Execution** policy will alert as soon as a process **rpm or dnf or yum** is executed.

{{% notice tip %}}
Like with most included policies it is not set to enforce!
{{% /notice %}}

## Test the Runtime Policy
To see how the alert would look like, we have to trigger the condition:

- You should have a namespace with your Quarkus application runnning
- In the **OpenShift Web Console** navigate to the pod and open a terminal into the container
- Run `yum search test`
- Go to the **Violations** view in the **ACS Portal**.
- You should see a violation of the policy, if you click it, you'll get the details.
- Run several `yum` commands in the terminal and check back with the **Violations** view:
  - As long as you stay in the same **deployment**, there won't be a new violation
  - but you will see the details for every new violation of the same type in the details.

## Enforce Runtime Protection
But the real fun starts when you enforce the policy. Using the included policy, it's easy to just "switch it on":

- In the **ACS Portal** bring up the **Red Hat Package Manager Execution**  Policy again.
- Click the **Edit Policy** button in the **Actions** drop-down to the upper right.
- Click **Next** until you arrive at the **Policy behaviour** page.
- Under **Response Method** select **Inform and enforce**
- Set **Configure enforcement behaviour** for **Runtime** to **Enforce on Runtime**
- Click **Next** until you arrive at the last page and click **Save**

Now trigger the policy again by opening a terminal into the pod in the **OpenShift Web Console** and executing `yum`. See what happens:
- Runtime enforcement will kill the pod immediately (via k8s).
- OpenShift will scale it up again automatically
  - This is to be expected and allows to contain a potential compromise while not causing a production outage.

## Architecture recap

{{< figure src="../images/workshop_architecture_full.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
