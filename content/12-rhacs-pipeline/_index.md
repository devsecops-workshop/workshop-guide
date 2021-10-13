+++
title = "Integrating ACS Scanning into the build Pipeline"
weight = 12
+++

Now it's time to put the **Sec** into **DevSecOps**. You should have configured a pipeline to build your Quarkus application. Now you will integrate some of ACS' capabilities into the build process.

{{% notice tip %}}
There are basically two ways to interface with ACS. The UI, which focuses on the needs of the security team, and a separate "interface" for developers to integrate into their existing toolset (CI/CD pipeline, consoles, ticketing systems etc): The `roxctl` commandline tool. This way ACS provides a familiar interface to understand and address issues that the security team considers important.
{{% /notice %}}

ACS policies can act during the CI/CD pipeline to identify security risk in images before they are run as a container.

## Let's go: Prepare `roxctl`

Build-time policies require the use of the `roxctl` command-line tool which is available for download from the ACS Central UI, in the upper right corner of the dashboard. `Roxctl` needs to authenticate to **ACS Central** to do anything. It can use either username and password authentication to Central, or API token based. It's good practice to use a token so that's what you'll do.

### Create the `roxctl` token

On the ACS portal:
- navigate to **Configure > Integrations**.
- Scroll down to the **Authentication Tokens** category, and select **API Token**.
- Click **Generate Token**. Enter a name for the token and select the role as **Admin**.
- Select **Generate**. The contents of the token should be copied and saved elsewhere.

### Create OCP secret with token
In your OCP cluster, create a secret with the API token in the project your pipeline lives in:
- In the UI switch to your Project
- Create a new key/value secret named **roxsecrets**
- Introduce these key/values into the secret:
  - **rox_central_endpoint**: \<the URL to your **ACS Portal**>
    - It sould be something like central-stackrox.apps.cluster-psslb.psslb.sandbox555.opentlc.com:443"
  - **rox_api_token**: \<the API token you generated>

## Create a Scan Task
You are now ready to create a new pipeline task that will use `roxctl` to scan the image build in your pipeline before the deploy step:
- In the OCP UI, make sure you are still in the project with your pipeline and the secret `roxsecrets`
- Go to **Pipelines->Tasks**
- Click **Create-> ClusterTask**
- Replace the YAML displayed with this:
```yaml
apiVersion: tekton.dev/v1beta1
kind: ClusterTask
metadata:
  name: rox-image-check
spec:
  params:
    - description: >-
        Secret containing the address:port tuple for StackRox Central (example -
        rox.stackrox.io:443)
      name: rox_central_endpoint
      type: string
    - description: Secret containing the StackRox API token with CI permissions
      name: rox_api_token
      type: string
    - description: 'Full name of image to scan (example -- gcr.io/rox/sample:5.0-rc1)'
      name: image
      type: string
  results:
    - description: Output of `roxctl image check`
      name: check_output
  steps:
    - env:
        - name: ROX_API_TOKEN
          valueFrom:
            secretKeyRef:
              key: rox_api_token
              name: $(params.rox_api_token)
        - name: ROX_CENTRAL_ENDPOINT
          valueFrom:
            secretKeyRef:
              key: rox_central_endpoint
              name: $(params.rox_central_endpoint)
      image: registry.access.redhat.com/ubi8/ubi-minimal:latest
      name: rox-image-check
      resources: {}
      script: >-
        #!/usr/bin/env bash

        set +x

        curl -k -L -H "Authorization: Bearer $ROX_API_TOKEN"
        https://$ROX_CENTRAL_ENDPOINT/api/cli/download/roxctl-linux --output
        ./roxctl  > /dev/null; echo "Getting roxctl"

        chmod +x ./roxctl  > /dev/null

        ./roxctl image check -c Deepspace --insecure-skip-tls-verify -e $ROX_CENTRAL_ENDPOINT
        --image $(params.image)
```

- Now add the **rox-image-check** task to your pipeling between the **build** and **deploy** steps. When you add it you have to fill in values for the parameters the task defines:
  - **rox_central_endpoint**: `roxsecrets`
  - **rox_api_token**: `roxsecrets`
  - **image**: `image-registry.openshift-image-registry.svc:5000/deepspace-int/quarkus-deepspace`
