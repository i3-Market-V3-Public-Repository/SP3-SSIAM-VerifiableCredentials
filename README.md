# i3-Market Verifiable Credential Service

The service for issuing, verifying and revoking W3C Verifiable Credential in i3-Market. 
You can find the detailed documentation about the service [here](https://i3-market.gitlab.io/code/backplane/backplane-api-gateway/backplane-api-specification/systems/trust-security-privacy/ssi-iam/user-centric-authentication.html#troubleshooting).

## Table of contents
- [i3-Market Verifiable Credential Service](#i3-market-verifiable-credential-service)
  * [Project requirements](#project-requirements)
  * [Cloning the project](#cloning-the-project)
  * [Initial environment configuration](#initial-environment-configuration)
  * [Local development using Node.js](#local-development-using-nodejs)
  * [Local development using docker](#local-development-using-docker)
      - [Development scripts in the docker container](#development-scripts-in-the-docker-container)
  * [Building the production image](#building-the-production-image)
  * [Production deployment](#production-deployment)
  * [Wallet integration](#wallet-integration)
  * [Wallet integration](#wallet-integration)
  * [Usage and documentations](#usage-and-documentations)


## Project requirements

The following programs and libraries are required to be able to perform all subsequent instructions.

- WSL
- Git
- Node.js
- Docker
- [i3-Market wallet desktop](http://95.211.3.251:8081/#browse/browse:i3m-raw:i3m-wallet%2F1.0.0), version 1.0.0 or more

To check that everything is fine, you should see the following commands working:
```console
$ npm -v
6.14.8
$ node -v
v14.15.1
$ ts-node -v
v10.4.0
$ nvm --version
0.33.2
```

>  WARNING: In case some packages are missing, you can install them using the `npm i <PACKAGE_NAME>` command

## Cloning the project

Clone the repository with Git

```console 
$ git clone git@gitlab.com:i3-market/code/wp3/t3.1-self-sovereign-identity-and-access-management/verifiable-credentials.git
$ cd verifiable-credentials
```

## Initial environment configuration

Create a `.env.vc` and a `.env` file and configure the service using the environmental variables defined in the [template.env](./template.env) file.

> WARNING: Paths should be relative to the `app` directory

You can run the project in development in two ways: directly through Node.js or using Docker. Both modes are described below.

## Local development using Node.js

To run the service locally using Node.js it is necessary to download it before.
After that you can install the dependencies and start the service in the following way:

```console 
$ cd verifiable-credentials/app
$ npm i
$ npm start
```

You have also to update the configuration file `app/src/config.ts` before running the service. 
Specifically, it is necessary to fill the default environment variables, in the same way they are filled in the env file.


## Local development using docker

To startup the project in development way using docker you have to run the following command in the project root. The first time it will take a while (be patience), since it has to build images and download all the npm dependencies.

```console
./docker-dev-start
```

The OAS documentation can be accessed on [http://localhost:4200/release2/vc/api-spec/ui](http://localhost:4200/release2/vc/api-spec/ui).

You can stop the container at any time with `Ctrl-C`.

If you want to delete and prune all the created images, containers, networks, volumes, just run

```console
./docker-dev-prune
```

Since the `app` directory is shared with the docker container with mapped user permissions, you can just edit any files in the `app` directory locally. The container will be running `ts-node` and `nodemon` to directly execute the source code and refresh the server if any file has changed. You can also attach any debugger in your local machine to the container, which will be listening at default port 9229.

#### Development scripts in the docker container

Since `npm` and `node` are likely to be needed, if your OS allows you to execute shell scripts inside the docker container, you can just also use the `npm` and `node` scripts provided for convenience.

```console
$ ./npm -v
6.14.8
$ ./node -v
v14.15.1
```

## Building the production image

You can build the production docker image using the helpers provided in this repository:

```console
# Build the image to work locally
./docker-prod-build

# Build and push the image into the gitlab registry
./docker-prod-push
```

## Production deployment

To deploy this service in a server it is just necessary to copy the `docker-compose.yaml` and `vc.env` files in a server directory and run the following command:

```console
$ docker-compose up
```

The docker-compose will pull the production image directly from the i3-Market Gitlab container registry.
You need to have a valid Gitlab access to pull it.

## Wallet integration

This service is integrated with the i3-Market Wallet desktop application, downloadable from the i3-Market [Nexus repository](http://95.211.3.251:8081/#browse/browse:i3m-raw:i3m-wallet%2F1.0.0) or from [Github](https://github.com/i3-Market-V2-Public-Repository/SP3-SCGBSSW-I3mWalletMonorepo/releases). For information on how to pair the wallet with the service once running, see the instructions [here](./Wallet%20protocol%20integration.pdf).

## Usage and documentations
The documentation is available on the [i3-Market development portal](https://i3-market.gitlab.io/code/backplane/backplane-api-gateway/backplane-api-specification/systems/trust-security-privacy/ssi-iam/user-centric-authentication.html#troubleshooting).