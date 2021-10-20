+++
title = "Getting to know ACS"
weight = 20
+++

Before we start to integrate **Red Hat Advanced Cluster Security** in our setup, you should become familiar with the basic concepts.

## ACS Features

ACS delivers on these security use cases:

- **Vulnerability Management**: Protect the software supply chain and prevent known vulnerabilities from being used as an entry point in your applications.
- **Configuration Management**: Leverage the OpenShift platform for declarative security to prevent or limit attacks, even in the presence of exploitable vulnerabilities.
- **Network Segmentation**: Using Kubernetes network policies in OpenShift, restrict open network paths for isolation and to prevent lateral movement by attackers.
- **Risk Profiling**: Prioritize applications and security risks automatically to focus investigation and mitigation efforts.
- **Threat detection and incident response**: Continuous observation and response in order to take action on attack-related activity, and to use observed behavior to inform mitigation efforts to harden security.
- **Compliance**: Making sure that industry and regulatory standards are being met in your OpenShift environments.

## UI Overview
- **Dashboard**:
The dashboard serves as the security overview - helping the security team understand what the sources of risk are, categories of violations, and gaps in compliance. All of the elements are clickable for more information and categories are customizable.

- **Top bar**:
Near the top, we see an overview of our OpenShift clusters. It provides insight into the usage of images and secrets.
The top bar provides links to Search, Command-line tools, Cluster Health, Documentation, API Reference, and logged-in
user account

- **Left menus**:
The left hands side menus provide navigation into each of the security use-cases, as well as product configuration to integrate with your existing tooling.

- **Global Search**:
On every page throughout the UI, the global search allows you to search for any data that ACS tracks.

## Exploring the Security Use Cases
Now start to explore the Security Use Cases ACS targets as provided in the left side menu.

- **Network Graph**:
  - The Network Graph is a flow diagram, firewall diagram, and firewall rule builder in one.
  - The default view **Active** the actual traffic for the Past Hour between the deployments in all namespaces is shown.

- **Violations**:
  - Violations record all times where a policy criteria was triggered by any of the objects in your cluster - images, components, deployments, runtime activity.

- **Compliance**:
  - The compliance reports gather information for configuration, industry standards, and best practices for container-based workloads running in OpenShift.

- **Vulnerability Management**:
  - Vulnerability Management provides several important reports - where the vulnerabilities are, which are the most widespread or the most recent, where my images are coming from.
  - In the upper right are buttons to link to all policies, CVEs, and images, and a menu to bring you to reports by cluster, namespace, deployment, and co.

- **Configuration Management**:
  - Configuration management provides visibility into a number of infrastructure components: clusters and nodes, namespaces and deployments, and Kubernetes systems like RBAC and secrets.

- **Risk**:
  - The Risk view goes beyond the basics of vulnerabilities. It helps to understand how deployment configuration and runtime activity impact the likelihood of an exploit occurring and how successful those exploits will be.
  - This list view shows all deployments, in all clusters and namespaces, ordered by Risk priority.

## System Policies

As the foundation of ACS are the **system policies**, have a good look around:
- Navigate to the **System Policies** section from **Platform Configuration** in the left side menu.
- You will get an overview of the Built-in Policies
- All of the policies that ship with the product are designed with the goal of providing targeted remediation that improves security hardening.
- You’ll see this list contains many **Build** and **Deploy** time policies to catch misconfigurations early in the pipeline, but also **Runtime** policies.
- These policies come from us at Red Hat - our expertise, our interpretation of industry best practice, and our interpretation of common compliance standards, but you can modify them or create your own.

## Filters
Most UI pages have a filters section at the top that allows you to narrow the reporting view to matching or non-matching criteria. Almost all of the attributes that ACS gathers are filterable, try it out:
- Go to the **Risk** view
- Click in the **Filters** Bar
- Start typing `Process Name` and select the `Process Name` key
- Type `java` and press enter; click away to get the filters dropdown to clear
- You should see your deployment that has been “seen” running Java since it started
- Try another one: limit the filter to your Project namespace only
- Note the **Create Policy** button. It can be used to create a policy from the search filter to automatically identify this criteria.
