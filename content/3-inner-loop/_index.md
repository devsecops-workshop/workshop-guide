+++
title = "Inner Loop"
weight = 7
+++

In this part of the workshop you'll experience how modern software development using the OpenShift tooling can be done in a fast, iterative way. **Inner loop** here means **this is the way**, sorry, **process**, for developers to try out new things and quickly change and test their code on OpenShift without having to build new images all the time or being a Kubernetes expert.
![Inner Loop](../images/loop.png)

## Install and Prepare Red Hat OpenShift Dev Spaces

**OpenShift Dev Spaces** is a browser-based IDE for Cloud Native Development. All the heavy lifting is done though a container running your workspace on OpenShift. All you really need is a laptop. You can easily switch and setup customized environment, plugin, build tools and runtimes. So switching from one project context to another is as easy a switching a website. No more endless installation and configuration marathons on your dev laptop. It is already part of your OpenShift subscription. If you want to find out more have a look [here](https://developers.redhat.com/products/openshift-dev-spaces/overview)

- Install the **Red Hat OpenShift Dev Spaces** Operator from OperatorHub (not the previous Codeready Workspaces versions!) with default settings
- Go to **Installed Operators -> Red Hat OpenShift Dev Spaces** and create a new instance (**Red Hat OpenShift Dev Spaces instance Specification**) using the default settings in the project `openshift-operators`
- Wait until deployment has finished. This may take a couple of minutes as several components will be deployed.
- Once the instance status is ready (You can check the YAML of the instance: `status > chePhase: Active`), look up the `devspaces` Route in the `openshift-workspaces` namespace (You may need to toggle the **Show default project** button).
- Open the link in a new browser tab, click on **Log in with OpenShift** and log in with your OCP credentials
- Allow selected permissions

{{% notice tip %}}
We could create a workspace from one of the templates that come with CodeReady Workspaces, but we want to use a customized workspace with some additionally defined plugins in a [v2 devfile](https://devfile.io/) in our git repo. With devfiles you can share a complete workspace setup and with the click of a link and you will end up in a fully configured project in your browser.
{{% /notice %}}

- In the left click menu on **Create Workspace**
- Copy the **raw URL** of the `devfile_v2.yml` file in your `Gitea` repository by clicking on the file and then on the **Raw** button (or **Originalversion** in German).
- Paste the full URL into the **Git Repo URL** field and click **Create & Open**

{{< figure src="../images/crw.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

- You'll get into the **Starting workspace ...** view, give the workspace containers some time to spin up.

When your workspace has finally started, have a good look around in the UI. It should look familiar if you have ever worked with VSCode or similar IDEs.

{{% notice tip %}}
While working with Dev Spaces make sure you have AdBlockers disabled, you are not on a VPN and a have good internet connection to ensure a stable setup. If you are facing any issues try to reload the Browser window. If that doesn't help restart the workspace in the main Dev Spaces site under **Workspaces** and then menu **Restart Workspace**
{{% /notice %}}

## Clone the Quarkus Application Code

As an example you'll create a new Java application. You don't need to have prior experience programming in Java as this will be kept really simple.

{{% notice tip %}}
We will use a Java application based on the [Quarkus](https://quarkus.io/) stack. Quarkus enables you to create much smaller and faster containerized Java applications than ever before. You can even transcompile these apps to native Linux binaries that start blazingly fast. The app that we will use is just a starter sample created with the [Quarkus Generator](https://code.quarkus.io/) with a simple RESTful API that answers to http Requests. But at the end of the day this setup will work with any Java application. **Fun fact:** Every OpenShift Subscription already comes with a Quarkus Subscription.
{{% /notice %}}

Let's clone our project into our workspace :

- Bring up your `OpenShift Dev Spaces` in your browser
- In the bottom left click on **Clone Repository** and then enter the `Git URL` to your `Gitea` Repo (You can copy the URL by clicking on the clipboard icon)
- Press enter and then click the **Select Repository Location** button.
- in the bottom right corner your will see a notice `Would you like to open the cloned repository?`. Click **Open**
- The windows will briefly reload and then you will be in the cloned project folder

You should be greeted by the `README.md` file.

## Login to OpenShift and Create the Development Stage Project

Now we want to create a new OpenShift project for our app:

- Open a `terminal` on your DevSpaces IDE
  - On the top click menu clik on the cube icon (**Workspace**)
  - Then in the tree look for the `tools` and below clickon `> New Terminal` to open a new Terminal in the tools Pod
- Copy the `oc login` command from your OpenShift cluster (At the top right **Username > Copy login command**) and execute in the `terminal` to log into the OpenShift cluster
- Create a new project `workshop-dev`

```
oc new-project workshop-dev
```

## Use odo to Deploy and Update our Application

**odo** or 'OpenShift do' is a cli that enables developers to get started quickly with cloud native app development without being a Kubernetes expert. It offers support for multiple runtimes and you can easily setup microservice components, push code changes into running containers and debug remotely with just a few simple commands. To find out more, have look [here](https://odo.dev/)

First use `odo` ("OpenShift Do") to list the programming languages/frameworks it supports

```
odo catalog list components
```

Now initialize a new Quarkus application

```
odo create java-quarkus
```

And finally push the app to OpenShift

```
odo push
```

To test the app:

- In OpenShift open the `workshop-dev` project and switch to the **Developer Console**
- Open the **Topology** view and click on the top right link of Application icon to display the website of the app
- Your app should show up as a simple web page. In the `RESTEasy JAX-RS` section click the `@Path` endpoint `/hello` to see the result.

Now for the fun part: Using `odo` you can just dynamically change your code and push it out again without doing a new image build! No dev magic involved:

- In your CRW Workspace on the left, expand the file tree to open file `src/main/java/org/acme/GreetingRessource.java` and change the string "Hello RESTEasy" to "Hello Workshop" (CRW saves every edit directly. No need to save)
- Push the code to OpenShift again

```
odo push
```

- And reload the app webpage.
- Bam! The change should be there in a matter of seconds

## Architecture recap

{{< figure src="../images/workshop_architecture_inner_loop.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

