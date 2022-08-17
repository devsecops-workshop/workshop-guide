+++
title = "Inner Loop"
weight = 7
+++

In this part of the workshop you'll experience how modern software development using the OpenShift tooling can be done in a fast, iterative way. **Inner loop** here means **this is the way**, sorry, **process**, for developers to try out new things and quickly change and test their code on OpenShift without having to build new images all the time or being a Kubernetes expert.
![Inner Loop](../images/loop.png)

## Clone the Quarkus Application Code

As an example you'll create a new Java application. You don't need to have prior experience programming in Java as this will be kept really simple.

{{% notice tip %}}
We will use a Java application based on the [Quarkus](https://quarkus.io/) stack. Quarkus enables you to create much smaller and faster containerized Java applications than ever before. You can even transcompile these apps to native Linux binaries that start blazingly fast. The app that we will use is just a starter sample created with the [Quarkus Generator](https://code.quarkus.io/) with a simple RESTful API that answers to http Requests. But at the end of the day this setup will work with any Java application. **Fun fact:** Every OpenShift Subscription already comes with a Quarkus Subscription.  
{{% /notice %}}

Let's clone our project into our workspace :

- Bring up your `OpenShift Dev Spaces` in your browser
- In the bottom left click on **Clone Repository** and then enter the `Git URL` to your `Gitea` Repo (You can copy the URL by clicking on the clipboard icon)
- Press enter and then select **Select Repository Location**.
- in the bottom right corner your will see a notice `Would you like to open the cloned repository?`. Click **Open**
- The windows will briefly reload and then you will be in the cloned project folder

You should be greeted by the `README.md` file.

## Login to OpenShift and Create the Development Stage Project

Now we want to create a new OpenShift project for our app:

- Open a `terminal`
  - In **My Workspace** (cube icon) to the right click `tools > New Terminal`
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
